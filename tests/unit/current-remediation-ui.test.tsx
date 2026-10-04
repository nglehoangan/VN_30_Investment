import { afterEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { DashboardScreen } from "@/ui/dashboard";
import { ReviewForm } from "@/ui/review-form";
import { emptyDashboard } from "@/application/dashboard/model";
import { unavailableCurrent } from "@/application/current/read-model";
afterEach(cleanup);
it("renders exact current DTO values with separate accounting and informational sector labels",()=>{
 const m=emptyDashboard();m.status="SUCCESS";m.portfolio={id:"test",name:"TEST ONLY"};m.current={...unavailableCurrent(),status:"VALID",actionability:"PASS",reasons:[],scope:"FORMAL",nav:"123456789.123456789012",marketValue:"100000000.000000000001",unrealizedPnl:"5.000000000001",priceFreshness:"VALID",referenceFreshness:"VALID",reconciliation:"MATCH"};
 render(<DashboardScreen model={m} screen="dashboard" />);expect(screen.getByText("123456789.123456789012")).toBeTruthy();expect(screen.getByText("5.000000000001")).toBeTruthy();expect(screen.getByText(/CURRENT READ MODEL/)).toBeTruthy();expect(screen.getByText(/Current capital actionability: PASS/)).toBeTruthy();expect(screen.getByText(/Sector exposure is informational/)).toBeTruthy();
});
it("preview sends only intent and renders BLOCKED without formal creation",async()=>{
 const action=vi.fn().mockResolvedValue({status:"BLOCKED",portfolio:"BLOCKED",marketData:"UNKNOWN",analystEvidence:"INPUT REQUIRED",reasons:["SOURCE_UNAVAILABLE"],type:"WEEKLY"});
 render(<ReviewForm action={action} />);fireEvent.change(screen.getByLabelText(/Requested date/),{target:{value:"2026-10-03"}});fireEvent.click(screen.getByRole("button",{name:"Preview review readiness"}));
 await screen.findByText("Review readiness · BLOCKED");expect(action).toHaveBeenCalledWith("preview",{type:"WEEKLY",requestedDate:"2026-10-03",contributionReference:null,eventReference:null});expect(screen.queryByRole("button",{name:"Create formal review"})).toBeNull();
});
it("creation requires explicit ready confirmation; concurrent clicks share a lock",async()=>{
 let finish!:(v:unknown)=>void;const action=vi.fn().mockResolvedValueOnce({status:"READY",portfolio:"PASS",marketData:"VALID",analystEvidence:"READY",reasons:[],type:"WEEKLY"}).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
 render(<ReviewForm action={action} />);fireEvent.change(screen.getByLabelText(/Requested date/),{target:{value:"2026-10-03"}});fireEvent.click(screen.getByRole("button",{name:"Preview review readiness"}));const button=await screen.findByRole("button",{name:"Create formal review"});expect(action).toHaveBeenCalledTimes(1);fireEvent.click(button);fireEvent.click(button);expect(action).toHaveBeenCalledTimes(2);finish({status:"READY",portfolio:"PASS",marketData:"VALID",analystEvidence:"READY",reasons:[],type:"WEEKLY",artifactId:"review-id"});await waitFor(()=>expect(screen.getByRole("link",{name:"Read review"}).getAttribute("href")).toBe("/reviews/review-id"));
});
