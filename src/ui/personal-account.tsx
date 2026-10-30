import type { PersonalAccountView } from "@/domain/portfolio/personal-account";
import { Metrics, Panel, Table } from "./primitives";
const money = (v: string | null) => v === null ? null : v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export function PersonalAccount({ account: a, id }: { account: PersonalAccountView; id?: string }) {
  return <Panel title="Danh mục cá nhân · dữ liệu đã xác nhận">
    <p>Tiền và nghĩa vụ tại ngày <strong>{a.asOfDate}</strong>. Nguồn: sao kê Excel và xác nhận của chủ tài khoản.</p>
    <Metrics values={{ "Tiền mặt tại TCBS (VND)": money(a.cash), "Cổ tức chờ về · chưa nhận (VND)": money(a.pendingDividends), "Phí lưu ký phải trả (VND)": money(a.custodyFee), "Tiền được rút (VND)": money(a.withdrawable), "Sức mua gồm ngân hàng liên kết (VND)": money(a.buyingPower), "Tiền ngân hàng liên kết (VND)": money(a.linkedBankAvailable), "NAV broker báo cáo (VND)": money(a.brokerReportedNav) }} />
    <p>Cổ tức chờ về chưa được tính là tiền mặt; chỉ chuyển khi xác nhận tiền vào tài khoản. Sức mua đã trừ phí lưu ký. Phí lưu ký tích lũy và trừ cuối tháng. NAV broker đã trừ phí này.</p>
    <p>Giá vốn dùng số đã nhập. Giá trị cổ phiếu và lời/lỗ dưới đây theo giá nguồn tại <strong>{a.valuationAsOf ?? "chưa có giá"}</strong>, ngày giá được ghi trên từng dòng. Tải lại trang sau khi lấy API để xem giá mới.</p>
    <div className="personal-account-holdings"><Table headers={["Mã", "ISIN", "Sở hữu", "Giao dịch được", "Thưởng chưa giao dịch", "Giá vốn đã nhập (VND)", "Ngày giá", "Giá nguồn (VND)", "Giá trị theo nguồn (VND)", "Lời/lỗ theo giá nguồn (VND)"]} rows={a.positions.filter(p => !id || p.ticker === id || `${p.ticker}_WFT` === id || `${p.ticker}_UNAVAILABLE` === id).map(p => [p.ticker, p.isin, p.quantity, p.tradableQuantity, p.pendingQuantity, money(p.importedCost), p.priceAsOf, money(p.price), money(p.marketValue), money(p.unrealizedPnl)])} /></div>
    <p>FPT thưởng nằm trong tổng sở hữu, chưa được bán cho tới khi xác nhận chuyển trạng thái. Không cộng cổ tức chờ về hay sức mua vào NAV broker thêm lần nữa.</p>
  </Panel>;
}
