import Link from "next/link";
import type { DashboardModel } from "@/application/dashboard/model";
import type { BrokerSnapshot } from "@/domain/portfolio/broker-snapshot";
import { Metrics, Panel, Table } from "./primitives";

const brokerAmount = (value: string) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function BrokerSnapshotView({ snapshot: s, id }: { snapshot: BrokerSnapshot; id?: string }) {
  return <Panel title={`Dữ liệu danh mục ${s.broker}`}>
    <p>Holdings và giá theo nguồn TCBS: <strong>{s.holdingsAsOf}</strong> · Tiền cập nhật: <strong>{s.cashAsOf}</strong></p>
    <Metrics values={{ "Tiền mặt (VND)": brokerAmount(s.cash.balance), "Cổ tức chờ về (VND)": brokerAmount(s.cash.pendingDividends),
      "Tổng tiền và cổ tức chờ về (VND)": brokerAmount(s.cash.total), "Tiền được rút (VND)": brokerAmount(s.cash.withdrawable),
      "Giá trị cổ phiếu theo TCBS (VND)": brokerAmount(s.totals.marketValue), "Giá vốn nhập từ TCBS (VND)": brokerAmount(s.totals.openCost),
      "Tổng cổ phiếu": s.totals.quantity, "Cổ phiếu khả dụng theo TCBS": s.totals.tradeableQuantity }} />
    <p className="notice">Cổ tức chờ về là khoản phải thu, chưa phải tiền khả dụng. Giá cổ phiếu theo dữ liệu nguồn; chưa có NAV hiện tại khi dữ liệu tiền và giá khác ngày. Cổ phiếu chưa khả dụng được hiển thị riêng.</p>
    <Table headers={["Mã TCBS", "Số lượng", "Trạng thái", "Giá vốn/CP (VND)", "Tổng giá vốn (VND)", "Giá nguồn TCBS (VND)", "Giá trị nguồn TCBS (VND)"]}
      rows={s.positions.filter(p => !id || p.symbol === id || p.symbol === `${id}_UNAVAILABLE`).map(p => [p.symbol, p.quantity, p.status,
        brokerAmount(p.unitCost), brokerAmount(p.openCost), brokerAmount(p.price), brokerAmount(p.marketValue)])} />
    {s.timeBasis === "RETRIEVED_AT" && <p>Thời gian trên là lúc nhận response API, không phải thời điểm định giá được sàn xác nhận.</p>}
    <p>Mốc theo dõi từ sao kê: {s.trackingStartDate}. Hiệu suất từ mốc này chưa được tính khi chưa có baseline NAV cùng ngày được đối soát. Giá vốn vị thế giữ theo TCBS.</p>
    <p>Snapshot nguồn đã tải vào ứng dụng. Chưa chuyển thành sổ giao dịch; dữ liệu này không tự cấp quyền giao dịch.</p>
  </Panel>;
}

export function BrokerMarketView({ data, compact = false }: { data: NonNullable<DashboardModel["brokerApiData"]>; compact?: boolean }) {
  return <Panel title="Bảng giá VN30 từ TCBS">
    <p>Ngày giao dịch: {data.tradingDate ?? "Chưa xác định"} · Nhận dữ liệu: {data.sources.find(s => s.apiId === "5.1")?.receivedAt ?? "Chưa có"}</p>
    <Table headers={["Mã", "Giá khớp (VND)", "Tham chiếu (VND)", "Thay đổi (%)", "Khối lượng"]}
      rows={data.quotes.slice(0, compact ? 5 : 100).map(q => [<Link key={q.symbol} href={`/holdings/${q.symbol}`}>{q.symbol}</Link>, brokerAmount(String(q.price)), brokerAmount(String(q.reference)), q.changePercent?.toFixed(2) ?? "Chưa có", brokerAmount(String(q.volume))])}
      empty="Chưa có dữ liệu bảng giá TCBS." />
    <p>Giá tại lần lấy dữ liệu đã lưu; bảng giá chưa tự cập nhật theo thời gian thực.</p>
    {compact && <Link href="/vn30">Xem toàn bộ {data.quotes.length} mã</Link>}
  </Panel>;
}

export function BrokerSourcesView({ data }: { data: NonNullable<DashboardModel["brokerApiData"]> }) {
  return <Panel title="Tài khoản và dữ liệu API TCBS">
    <Table headers={["Loại tiểu khoản", "Số tài khoản", "Trạng thái"]} rows={data.accounts.map(a => [a.type, a.number, a.active ? "Hoạt động" : "Không hoạt động"])} />
    <h3>Dữ liệu đã lưu từ API</h3>
    <Table headers={["API", "HTTP", "Thời gian nhận"]} rows={data.sources.map(s => [s.apiId, s.httpStatus, s.receivedAt])} />
    <p>Số tài khoản được che bớt trên giao diện. Thời gian ghi nhận là lúc nhận response.</p>
  </Panel>;
}
