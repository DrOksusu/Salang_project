"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useToast, ToastContainer } from "@/components/ui/toast";

interface SettingsData {
  id: number;
  labor_cost_ratio: number;
  incentive_ratio: number;
  design_team_labor_cost_ratio: number;
  field_team_labor_cost_ratio: number;
  design_team_incentive_ratio: number;
  field_team_incentive_ratio: number;
  sales_team_labor_cost_ratio: number;
  sales_team_incentive_ratio: number;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function SettingsPage() {
  const [laborCostRatio, setLaborCostRatio] = useState("");
  const [incentiveRatio, setIncentiveRatio] = useState("");
  const [designTeamRatio, setDesignTeamRatio] = useState("");
  const [fieldTeamRatio, setFieldTeamRatio] = useState("");
  const [designTeamIncentiveRatio, setDesignTeamIncentiveRatio] = useState("");
  const [fieldTeamIncentiveRatio, setFieldTeamIncentiveRatio] = useState("");
  const [salesTeamRatio, setSalesTeamRatio] = useState("");
  const [salesTeamIncentiveRatio, setSalesTeamIncentiveRatio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toasts, toast, dismissToast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get<ApiResponse<SettingsData>>("/api/settings");
        if (res.success && res.data) {
          setLaborCostRatio(String(res.data.labor_cost_ratio));
          setIncentiveRatio(String(res.data.incentive_ratio));
          setDesignTeamRatio(String(res.data.design_team_labor_cost_ratio));
          setFieldTeamRatio(String(res.data.field_team_labor_cost_ratio));
          setDesignTeamIncentiveRatio(String(res.data.design_team_incentive_ratio));
          setFieldTeamIncentiveRatio(String(res.data.field_team_incentive_ratio));
          setSalesTeamRatio(String(res.data.sales_team_labor_cost_ratio));
          setSalesTeamIncentiveRatio(String(res.data.sales_team_incentive_ratio));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "설정을 불러올 수 없습니다.";
        toast({ title: "오류", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put<ApiResponse<SettingsData>>("/api/settings", {
        labor_cost_ratio: Number(laborCostRatio),
        incentive_ratio: Number(incentiveRatio),
        design_team_labor_cost_ratio: Number(designTeamRatio),
        field_team_labor_cost_ratio: Number(fieldTeamRatio),
        design_team_incentive_ratio: Number(designTeamIncentiveRatio),
        field_team_incentive_ratio: Number(fieldTeamIncentiveRatio),
        sales_team_labor_cost_ratio: Number(salesTeamRatio),
        sales_team_incentive_ratio: Number(salesTeamIncentiveRatio),
      });
      if (res.success) {
        toast({ title: "성공", description: "설정이 저장되었습니다." });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "설정 저장에 실패했습니다.";
      toast({ title: "오류", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">설정</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>비율 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="laborCostRatio">인건비율 (%)</Label>
            <Input
              id="laborCostRatio"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={laborCostRatio}
              onChange={(e) => setLaborCostRatio(e.target.value)}
              placeholder="예: 30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incentiveRatio">인센티브율 (%)</Label>
            <Input
              id="incentiveRatio"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={incentiveRatio}
              onChange={(e) => setIncentiveRatio(e.target.value)}
              placeholder="예: 10"
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>팀별 지표 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">팀</TableHead>
                <TableHead>인건비율 (%)</TableHead>
                <TableHead>인센티브율 (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">디자인팀</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={designTeamRatio}
                    onChange={(e) => setDesignTeamRatio(e.target.value)}
                    className="w-28"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={designTeamIncentiveRatio}
                    onChange={(e) => setDesignTeamIncentiveRatio(e.target.value)}
                    className="w-28"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">현장팀</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={fieldTeamRatio}
                    onChange={(e) => setFieldTeamRatio(e.target.value)}
                    className="w-28"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={fieldTeamIncentiveRatio}
                    onChange={(e) => setFieldTeamIncentiveRatio(e.target.value)}
                    className="w-28"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">영업팀</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={salesTeamRatio}
                    onChange={(e) => setSalesTeamRatio(e.target.value)}
                    className="w-28"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={salesTeamIncentiveRatio}
                    onChange={(e) => setSalesTeamIncentiveRatio(e.target.value)}
                    className="w-28"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </CardContent>
      </Card>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
