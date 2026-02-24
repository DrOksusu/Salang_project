export type UserRole = "admin" | "team_leader" | "employee";

export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  position: string | null;
  team: string | null;
  hire_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: number;
  labor_cost_ratio: number;
  incentive_ratio: number;
  design_team_labor_cost_ratio: number;
  field_team_labor_cost_ratio: number;
  design_team_incentive_ratio: number;
  field_team_incentive_ratio: number;
  sales_team_labor_cost_ratio: number;
  sales_team_incentive_ratio: number;
  design_team_margin_ratio: number;
  field_team_margin_ratio: number;
  sales_team_margin_ratio: number;
  updated_at: string;
}

export interface MonthlySalary {
  id: number;
  user_id: number;
  year: number;
  month: number;
  amount: number;
  created_at: string;
}

export interface MonthlySales {
  id: number;
  year: number;
  month: number;
  amount: number;
  created_at: string;
}

export interface SalesEntry {
  id: number;
  year: number;
  month: number;
  sale_date: string;
  amount: number;
  profit: number;
  description: string | null;
  created_at: string;
}

export interface MonthlyIncentive {
  id: number;
  user_id: number;
  year: number;
  month: number;
  amount: number;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardSummary {
  year: number;
  month: number;
  totalLaborCost: number;
  actualSales: number;
  actualProfit: number;
  targetProfit: number;
  excessProfit: number;
  incentiveTotal: number;
  designTeamIncentive: number;
  fieldTeamIncentive: number;
  laborCostRatio: number;
  incentiveRatio: number;
  designTeamLaborCostRatio: number;
  fieldTeamLaborCostRatio: number;
  designTeamLaborCost: number;
  designTeamTargetProfit: number;
  designTeamExcessProfit: number;
  designTeamIncentiveRatio: number;
  fieldTeamLaborCost: number;
  fieldTeamTargetProfit: number;
  fieldTeamExcessProfit: number;
  fieldTeamIncentiveRatio: number;
  salesTeamLaborCost: number;
  salesTeamTargetProfit: number;
  salesTeamExcessProfit: number;
  salesTeamIncentiveRatio: number;
  salesTeamLaborCostRatio: number;
  salesTeamIncentive: number;
}
