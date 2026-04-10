import { Settings } from "lucide-react";

export default function SellerSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าร้าน</h1>
        <p className="text-sm text-muted-foreground">
          ตั้งค่าข้อมูลร้านค้าของคุณ
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
        <Settings className="mb-3 h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">เร็วๆ นี้</p>
        <p className="text-sm">ระบบตั้งค่าร้านค้ากำลังพัฒนา</p>
      </div>
    </div>
  );
}
