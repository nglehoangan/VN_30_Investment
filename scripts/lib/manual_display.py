"""Geometry-based presentation candidates. Never assigns accounting admission.

Rows/columns are deliberately marked as candidates until reviewed. Unknown
periods and ambiguous numeric strings remain explicit rather than guessed.
"""
import re
import unicodedata
from datetime import date

REPORTS = {
    "can-doi-ke-toan": "Cân đối kế toán",
    "ket-qua-kinh-doanh": "Kết quả kinh doanh",
    "luu-chuyen-tien-te": "Lưu chuyển tiền tệ",
    "thuyet-minh": "Thuyết minh báo cáo tài chính",
    "bao-cao-bo-sung": "Báo cáo và tài liệu bổ sung",
}


def fold(text):
    return "".join(c for c in unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
                   if unicodedata.category(c) != "Mn")


def normalize_number(text):
    text = text.strip().replace("−", "-").replace("–", "-").replace("\u00a0", " ")
    if text.endswith("%"):
        text = text[:-1].strip()
    if text in {"-", "—", ""}:
        return None, "DASH" if text else "MISSING_CELL"
    negative = text.startswith("(") and text.endswith(")")
    number = text[1:-1] if negative else text
    number = number.strip().replace(" ", "")
    if re.fullmatch(r"-?\d{1,3}(?:\.\d{3})+(?:,\d+)?", number):
        number = number.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"-?\d{1,3}(?:,\d{3}){2,}(?:\.\d+)?", number):
        number = number.replace(",", "")
    elif re.fullmatch(r"-?\d+", number):
        pass
    elif re.fullmatch(r"-?\d+,\d{1,2}", number):
        number = number.replace(",", ".")
    elif re.fullmatch(r"-?\d+\.\d{1,2}", number):
        pass
    else:
        return None, "AMBIGUOUS_NUMERIC_FORMAT"
    if negative:
        number = "-" + number.lstrip("-")
    # String operations only: no float conversion of financial amounts.
    sign = "-" if number.startswith("-") else ""
    whole, dot, fraction = number.lstrip("-").partition(".")
    number = sign + (whole.lstrip("0") or "0") + (dot + fraction if dot else "")
    zero = not any(c in "123456789" for c in number)
    return number, "ZERO" if zero else "VALUE"


def line_groups(words, tolerance=.006):
    lines = []
    for word in sorted(words, key=lambda w: (w["y"] + w["height"] / 2, w["x"])):
        center = word["y"] + word["height"] / 2
        nearby = next((line for line in reversed(lines[-4:]) if abs(line["center"]-center) <= tolerance), None)
        if nearby is None:
            nearby = {"center": center, "words": []}
            lines.append(nearby)
        nearby["words"].append(word)
    for line in lines:
        line["words"].sort(key=lambda w: w["x"])
        line["text"] = " ".join(w["text"] for w in line["words"])
    return sorted(lines, key=lambda line: line["center"])


def classify_page(words):
    top = " ".join(line["text"] for line in line_groups([w for w in words if w["y"] < .26]))
    text = fold(top)
    if "thuyet minh bao cao" in text or "notes to the" in text or "notes to consolidated" in text:
        return "thuyet-minh", top
    found = []
    if any(cue in text for cue in ["bang can doi ke toan", "bao cao tinh hinh tai chinh", "balance sheet", "statement of financial position"]):
        found.append("can-doi-ke-toan")
    if any(cue in text for cue in ["bao cao ket qua hoat dong", "ket qua hoat dong kinh doanh", "ket qua kinh doanh", "income statement", "statement of income", "statement of profit"]):
        found.append("ket-qua-kinh-doanh")
    if any(cue in text for cue in ["luu chuyen tien te", "cash flow statement", "statement of cash flows"]):
        found.append("luu-chuyen-tien-te")
    if not found:
        # Form codes are useful when the OCR reader misses the long title.
        # Bank form numbering differs from ordinary corporate statements.
        form = re.search(r"(?:mau|form)\s+b\s*0?([123459])[a-z]?\s*[-/]\s*(tctd|dn|ctck)", text)
        if form:
            mapping = ({"2":"can-doi-ke-toan", "3":"ket-qua-kinh-doanh", "4":"luu-chuyen-tien-te", "5":"thuyet-minh"}
                       if form.group(2) == "tctd" else {"1":"can-doi-ke-toan", "2":"ket-qua-kinh-doanh", "3":"luu-chuyen-tien-te", "9":"thuyet-minh"})
            if form.group(1) in mapping:
                found.append(mapping[form.group(1)])
    return (found[0] if len(found) == 1 else None), top


def split_numeric_boxes(words):
    """Keep each original reader index; subdivided positions are approximate."""
    result = []
    for index, word in enumerate(words):
        text = word["text"].strip()
        # Vision sometimes emits two adjacent values as one rectangle.
        if not re.fullmatch(r"[\d\s.,()\-−–—%]+", text):
            continue
        tokens = list(re.finditer(r"\(?[−–-]?\d[\d.,]*\)?%?|[—–-]", text))
        if not tokens:
            continue
        for match in tokens:
            result.append({**word, "text": match.group(), "readerWordIndex": index,
                           "x": word["x"] + word["width"] * match.start() / max(len(text), 1),
                           "width": word["width"] * len(match.group()) / max(len(text), 1),
                           "approximateGeometry": len(tokens) > 1})
    return result


def numeric_columns(tokens):
    anchors = [w for w in tokens if .35 < w["x"] < .96 and .17 < w["y"] < .88
               and len(re.sub(r"\D", "", w["text"])) >= 4
               and not re.fullmatch(r"(?:19|20)\d{2}", w["text"])
               and not re.search(r"\d[/.]\d{1,2}[/.](?:19|20)\d{2}", w["text"])]
    clusters = []
    for word in sorted(anchors, key=lambda w: w["x"] + w["width"]):
        end = word["x"] + word["width"]
        cluster = next((c for c in clusters if abs(c["end"]-end) < .022), None)
        if cluster is None:
            cluster = {"end": end, "words": []}
            clusters.append(cluster)
        cluster["words"].append(word)
        cluster["end"] = sum(w["x"]+w["width"] for w in cluster["words"]) / len(cluster["words"])
    clusters = [c for c in clusters if len(c["words"]) >= 3]
    if not clusters:
        return []
    peak = max(len(c["words"]) for c in clusters)
    clusters = [c for c in clusters if len(c["words"]) >= max(3, peak*.25)]
    return sorted(clusters, key=lambda c: c["end"])[-6:]


def unit_evidence(words, first_row):
    header = " ".join(w["text"] for w in words if w["y"] < first_row and w["y"] < .4)
    text = fold(header)
    for cues, scale, label in [(["trieu dong", "trieu vnd", "vnd million", "millions of vnd"], "1000000", "MILLION_CURRENCY"),
                               (["nghin dong", "ngan dong", "vnd thousand", "thousands of vnd"], "1000", "THOUSAND_CURRENCY"),
                               (["ty dong", "vnd billion"], "1000000000", "BILLION_CURRENCY")]:
        if any(cue in text for cue in cues):
            return {"currency": "VND", "scale": scale, "unit": label, "status": "PAGE_HEADER_CANDIDATE", "headerText": header}
    if re.search(r"\bvnd\b|\bvn[dđ]\b|(?:don vi(?: tinh)?|dvt)\s*:?\s*dong", text):
        return {"currency": "VND", "scale": "1", "unit": "CURRENCY", "status": "PAGE_HEADER_CANDIDATE", "headerText": header}
    return {"currency": None, "scale": None, "unit": None, "status": "UNDECLARED", "headerText": header}


def period_for_column(words, cluster, first_row, column_index, identity, report):
    start = min(w["x"] for w in cluster["words"])
    midpoint = (start + cluster["end"]) / 2
    legal_words = {id(w) for line in line_groups([w for w in words if w["y"] < first_row])
                   if re.search(r"thong tu|ban hanh|bo tai chinh|circular|mau b|issued", fold(line["text"]))
                   for w in line["words"]}
    headers = [w for w in words if id(w) not in legal_words and w["x"] > .25 and w["y"] < first_row-.006 and w["y"] > .1
               and len(w["text"]) < 90
               and not re.search(r"thong tu|ban hanh|bo tai chinh|circular|mau b|issued", fold(w["text"]))]
    years = []
    for word in headers:
        for match in re.finditer(r"\b((?:19|20)\d{2})\b", word["text"]):
            x = word["x"] + word["width"] * (match.start()+2) / max(len(word["text"]), 1)
            if abs(x-midpoint) < .1:
                years.append((abs(x-midpoint) + max(0, .15-word["y"]), int(match.group()), word))
    header_text = " ".join(w["text"] for w in headers if abs(w["x"]+w["width"]/2-midpoint) < .1)
    year = min(years, key=lambda x:x[0])[1] if years else None
    label = header_text.strip() or f"Cột {column_index+1} chưa xác định kỳ"
    period_type = "UNKNOWN"
    quarter = None
    local = fold(header_text)
    # Source-qualified dimensions may be reused only for the exact document hash.
    if identity:
        end = identity["reportingPeriod"]["end"]
        start_date = identity["reportingPeriod"]["start"]
        month = int(end[5:7])
        if year is not None:
            if month == 12 and start_date[5:] == "01-01":
                period_type = "ANNUAL"
            elif report == "can-doi-ke-toan" and year < int(end[:4]):
                # Comparative balance columns often refer to prior year end.
                if re.search(r"31[/.]12|31\s+thang\s+12", fold(header_text)):
                    period_type = "ANNUAL"
            else:
                quarter = identity.get("fiscalQuarter")
                period_type = "QUARTER" if quarter and start_date[5:] != "01-01" else "YTD"
                quarter = quarter or (month+2)//3
    # Local column headings can distinguish a quarter from cumulative flows in
    # the very same report. Never subtract columns to invent standalone flows.
    if year is not None:
        for pattern, q in [(r"9 thang|chin thang|nine.months", 3), (r"6 thang|sau thang|six.months", 2)]:
            if re.search(pattern, local):
                period_type, quarter = "YTD", q
        if "luy ke" in local and quarter:
            period_type = "YTD"
    if year is not None and period_type == "UNKNOWN":
        # Explicit year-only headers plus an annual report title support annual display.
        title = fold(" ".join(w["text"] for w in words if w["y"] < .17))
        if re.search(r"cho nam|nam tai chinh ket thuc|for the year|year ended", title) and not re.search(r"giua nien do|interim|6 thang|sau thang", title):
            period_type = "ANNUAL"
        elif re.search(r"6 thang|sau thang|six.months", title):
            period_type, quarter = "YTD", 2
        else:
            match = re.search(r"quy\s+(IV|III|II|I|[1-4])\b", title, re.IGNORECASE)
            if match:
                period_type = "QUARTER"
                quarter = {"I":1, "II":2, "III":3, "IV":4}.get(match.group(1).upper()) or int(match.group(1))
    as_of = None
    if report == "can-doi-ke-toan":
        dates = re.findall(r"\b(\d{1,2})[/.](\d{1,2})[/.]((?:19|20)\d{2})\b", header_text)
        dates += re.findall(r"\b(\d{1,2})\s+thang\s+(\d{1,2})\s+nam\s+((?:19|20)\d{2})\b", fold(header_text))
        valid = set()
        for day, month, date_year in dates:
            try:
                valid.add(date(int(date_year), int(month), int(day)).isoformat())
            except ValueError:
                pass
        if len(valid) == 1:
            as_of = next(iter(valid))
            year = int(as_of[:4])
            # Opening balances (e.g. 1/1/2025) must not be merged with the
            # closing 31/12/2025 merely because both headers contain 2025.
            if as_of[5:] != "12-31" or not identity or period_type != "ANNUAL":
                period_type, quarter = "INSTANT", None
    if as_of and period_type == "INSTANT":
        key = as_of
    elif year is None or period_type == "UNKNOWN":
        key = f"UNRESOLVED-{year or 'YEAR'}-C{column_index+1}"
    elif period_type == "ANNUAL":
        key = str(year)
    else:
        key = f"{year}-{'Q' if period_type == 'QUARTER' else 'YTD'}{quarter}"
    return {"periodKey": key, "year": year, "quarter": quarter, "periodType": period_type, "asOf": as_of,
            "label": label, "status": "HEADER_CANDIDATE" if year else "REVIEW_REQUIRED",
            "headerEvidence": [{"text": w[2]["text"], "x": w[2]["x"], "y": w[2]["y"]} for w in years]}


def extract_table(words, identity=None, report="bao-cao-bo-sung"):
    word_indices = {id(word): index for index, word in enumerate(words)}
    tokens = split_numeric_boxes(words)
    columns = numeric_columns(tokens)
    if not columns:
        return []
    selected = []
    for word in tokens:
        end = word["x"] + word["width"]
        distances = [abs(end-c["end"]) for c in columns]
        nearest = min(range(len(columns)), key=lambda i: distances[i])
        if distances[nearest] < .03 and .17 < word["y"] < .88:
            if re.fullmatch(r"(?:19|20)\d{2}", word["text"]) and word["y"] < .3:
                continue
            selected.append({**word, "column": nearest})
    lines = line_groups(selected, .006)
    if len(lines) < 3:
        return []
    first_row = min(w["y"] for w in lines[0]["words"])
    unit = unit_evidence(words, first_row)
    first_column_start = min(w["x"] for w in selected if w["column"] == 0)
    # A wide first value region must not consume the caption; separate the code
    # and note-reference columns using their explicit header when available.
    code_headers = [w for w in words if w["y"] < first_row and w["y"] > .1
                    and (fold(w["text"]).strip() in {"ma", "ma so", "code", "codes"}
                         or fold(w["text"]).startswith("ma thuyet"))]
    label_end = min([w["x"] for w in code_headers if w["x"] > .3] or [first_column_start-.025])
    candidates = []
    label_words = [w for w in words if w["x"] < label_end-.005 and w["x"] < first_column_start-.02
                   and w["y"] > max(.14, first_row-.025) and w["y"] < .88
                   and not re.fullmatch(r"[\d\s.,()\-−–—]+", w["text"].strip())]
    for i, line in enumerate(lines):
        lower = (lines[i-1]["center"]+line["center"])/2 if i else first_row-.016
        upper = (line["center"]+lines[i+1]["center"])/2 if i+1 < len(lines) else line["center"]+.025
        caption_words = [w for w in label_words if lower <= w["y"]+w["height"]/2 < upper]
        caption_lines = [l for l in line_groups(caption_words)
                         if not re.search(r"dieu chinh cho cac khoan|luu chuyen tien tu hoat dong", fold(l["text"]))]
        caption_words = [w for l in caption_lines for w in l["words"]]
        caption = " ".join(l["text"] for l in caption_lines)
        if not caption:
            caption = None
        code_words = [w for w in words if lower <= w["y"]+w["height"]/2 < upper
                      and label_end-.01 <= w["x"] < first_column_start-.015
                      and re.fullmatch(r"\d{1,3}", w["text"].strip())]
        code = code_words[0]["text"] if len(code_words) == 1 else None
        by_column = {}
        for word in line["words"]:
            by_column.setdefault(word["column"], []).append(word)
        cells = []
        for c in range(len(columns)):
            choices = by_column.get(c, [])
            lexical = choices[0]["text"] if len(choices) == 1 else None
            value, status = normalize_number(lexical) if lexical is not None else (None, "MISSING_CELL" if not choices else "AMBIGUOUS_CELL")
            cells.append({"value": value, "lexicalValue": lexical, "status": status,
                          "geometryStatus": "APPROXIMATE_SPLIT_BOX" if any(w["approximateGeometry"] for w in choices) else "READER_BOX",
                          "readerWordIndices": [w["readerWordIndex"] for w in choices],
                          "boxes": [{k: w[k] for k in ["text", "x", "y", "width", "height", "confidence"]} for w in choices]})
        candidates.append({"code": code, "label": caption, "order": i, "labelStatus": "EXTRACTED_CANDIDATE" if caption else "MISSING_LABEL",
                           "captionWordIndices": [word_indices[id(w)] for w in caption_words],
                           "codeWordIndices": [word_indices[id(w)] for w in code_words] if code else [],
                           "captionBoxes": [{k:w[k] for k in ["text", "x", "y", "width", "height"]} for w in caption_words], "cells": cells})
    return [{"column": c, "period": period_for_column(words, cluster, first_row, c, identity, report),
             "unit": unit, "rows": [{**{k:v for k,v in row.items() if k != "cells"}, **row["cells"][c]} for row in candidates]}
            for c, cluster in enumerate(columns)]
