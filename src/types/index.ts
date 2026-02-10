export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  role: "admin" | "employee";
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
  targetSales: number;
  actualSales: number;
  excessSales: number;
  incentiveTotal: number;
  designTeamIncentive: number;
  fieldTeamIncentive: number;
  laborCostRatio: number;
  incentiveRatio: number;
  designTeamLaborCostRatio: number;
  fieldTeamLaborCostRatio: number;
}
