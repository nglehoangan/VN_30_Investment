import pathlib
import sys
import unittest
import importlib.util
import tempfile
import json
import hashlib
import contextlib
import io

sys.path.insert(0, str(pathlib.Path(__file__).parent / "lib"))
from manual_display import classify_page, extract_table, normalize_number, period_for_column

spec = importlib.util.spec_from_file_location("manual_mapping", pathlib.Path(__file__).parent / "map-manual-display.py")
mapping = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mapping)


def word(text, x, y, width=.12, height=.012):
    return {"text": text, "x": x, "y": y, "width": width, "height": height, "confidence": 1}


class ManualDisplayTests(unittest.TestCase):
    def test_lossless_amount_and_parenthesis_sign(self):
        self.assertEqual(normalize_number("9.007.199.254.740.993.123"), ("9007199254740993123", "VALUE"))
        self.assertEqual(normalize_number("(1.234.567)"), ("-1234567", "VALUE"))
        self.assertEqual(normalize_number("(1,234,567)"), ("-1234567", "VALUE"))

    def test_zero_dash_and_ambiguous_format_are_distinct(self):
        self.assertEqual(normalize_number("0"), ("0", "ZERO"))
        self.assertEqual(normalize_number("-"), (None, "DASH"))
        self.assertEqual(normalize_number(""), (None, "MISSING_CELL"))
        self.assertEqual(normalize_number("1,234"), (None, "AMBIGUOUS_NUMERIC_FORMAT"))
        self.assertEqual(normalize_number("I.234"), (None, "AMBIGUOUS_NUMERIC_FORMAT"))

    def test_decimal_percent(self):
        self.assertEqual(normalize_number("1,25%"), ("1.25", "VALUE"))

    def test_classification_avoids_contents_page_and_separates_notes(self):
        self.assertEqual(classify_page([word("Bảng cân đối kế toán hợp nhất", .1, .08)])[0], "can-doi-ke-toan")
        self.assertEqual(classify_page([word("Bảng cân đối kế toán", .1, .08),
                                        word("Báo cáo lưu chuyển tiền tệ", .1, .12)])[0], None)
        self.assertEqual(classify_page([word("Thuyết minh báo cáo tài chính", .1, .08)])[0], "thuyet-minh")
        self.assertEqual(classify_page([word("Báo cáo kết quả hoạt động kinh doanh", .1, .08)])[0], "ket-qua-kinh-doanh")
        self.assertEqual(classify_page([word("Mẫu B 03 - DN/HN", .7, .12)])[0], "luu-chuyen-tien-te")
        self.assertEqual(classify_page([word("Mẫu B03/TCTD-HN", .7, .12)])[0], "ket-qua-kinh-doanh")

    def test_two_columns_keep_years_and_values_independent(self):
        words = [word("Báo cáo kết quả hoạt động kinh doanh cho năm kết thúc", .1, .08, .8),
                 word("2025", .62, .18, .07), word("2024", .82, .18, .07),
                 word("VND", .62, .20, .07)]
        for i in range(4):
            y = .30+i*.05
            words.extend([word(f"Chỉ tiêu {i+1}", .1, y, .3), word(str(i+1), .47, y, .03),
                          word(f"{i+1}.000.000", .58, y, .15), word(f"{i+2}.000.000", .78, y, .15)])
        tables = extract_table(words, report="ket-qua-kinh-doanh")
        self.assertEqual(len(tables), 2)
        self.assertEqual([t["period"]["periodKey"] for t in tables], ["2025", "2024"])
        self.assertEqual(tables[0]["rows"][0]["value"], "1000000")
        self.assertEqual(tables[1]["rows"][0]["value"], "2000000")
        self.assertEqual(tables[0]["rows"][0]["label"], "Chỉ tiêu 1")
        self.assertEqual(tables[0]["unit"]["scale"], "1")

    def test_no_period_inference_from_filename_or_column_position(self):
        result = period_for_column([], {"end": .8, "words": [word("1.000", .6, .3)]}, .3, 0, None, "can-doi-ke-toan")
        self.assertTrue(result["periodKey"].startswith("UNRESOLVED"))
        self.assertIsNone(result["year"])

    def test_opening_and_closing_balances_of_same_year_are_different_periods(self):
        identity = {"reportingPeriod": {"start":"2025-01-01", "end":"2025-12-31"}, "fiscalQuarter":None}
        cluster = {"end":.75, "words":[word("1.000.000", .6, .3)]}
        opening = period_for_column([word("1/1/2025", .61, .18)], cluster, .3, 0, identity, "can-doi-ke-toan")
        closing = period_for_column([word("31/12/2025", .61, .18)], cluster, .3, 0, identity, "can-doi-ke-toan")
        self.assertEqual(opening["periodKey"], "2025-01-01")
        self.assertEqual(closing["periodKey"], "2025")

    def test_large_provider_level_is_not_a_tree_depth(self):
        # No hierarchy is inferred from account codes or numeric labels.
        self.assertEqual(classify_page([word("Statement of cash flows", .1, .08)])[0], "luu-chuyen-tien-te")

    def test_one_pdf_keeps_consolidated_and_standalone_variants_separate(self):
        pages = []
        for page_number, scope in enumerate(["hợp nhất", "riêng lẻ"], 1):
            words = [word("Báo cáo kết quả hoạt động kinh doanh cho năm kết thúc", .1, .08, .8),
                     word(scope, .1, .11), word("2025", .62, .18, .07)]
            for i in range(4):
                y = .3+i*.05
                words.extend([word(f"Chỉ tiêu {i}", .1, y, .3), word(f"{i+1}.000.000", .58, y, .15)])
            pages.append({"page":page_number, "words":words, "method":"TEST_NATIVE", "status":"RAW_EXTRACTION_UNREVIEWED"})
        with tempfile.TemporaryDirectory() as tmp:
            raw_path = pathlib.Path(tmp) / "raw.json"
            raw_path.write_text(json.dumps({"pages":pages}))
            document = {"ticker":"VNM", "sourceHash":"a"*64, "retainedPaths":["test.pdf"],
                        "rawDocumentPath":str(raw_path), "rawDocumentHash":hashlib.sha256(raw_path.read_bytes()).hexdigest(), "errors":[]}
            with contextlib.redirect_stdout(io.StringIO()):
                output, _, _ = mapping.build([document], {"statements":[], "canonicalFacts":[]})
        variants = output["VNM"]["reports"]["ket-qua-kinh-doanh"]["periods"]["2025"]["variants"]
        self.assertEqual(len(variants), 2)
        self.assertEqual({v["reportingScope"] for v in variants}, {"CONSOLIDATED", "STANDALONE"})
        self.assertNotEqual(variants[0]["id"], variants[1]["id"])
        self.assertTrue(variants[0]["groups"][0]["rows"][0]["cellEvidence"]["jsonPointers"][0].startswith("/pages/0/words/"))


if __name__ == "__main__":
    unittest.main()
