CREATE DATABASE IF NOT EXISTS salang_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE salang_db;

-- 사용자
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'team_leader', 'employee') NOT NULL DEFAULT 'employee',
  position VARCHAR(100) DEFAULT NULL,
  team VARCHAR(50) DEFAULT NULL,
  hire_date DATE DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 시스템 설정
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  labor_cost_ratio DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  incentive_ratio DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  design_team_labor_cost_ratio DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  field_team_labor_cost_ratio DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  design_team_incentive_ratio DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  field_team_incentive_ratio DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  sales_team_labor_cost_ratio DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  sales_team_incentive_ratio DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  design_team_margin_ratio DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  field_team_margin_ratio DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  sales_team_margin_ratio DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 기본 설정 1행 삽입
INSERT INTO settings (labor_cost_ratio, incentive_ratio, design_team_labor_cost_ratio, field_team_labor_cost_ratio, design_team_incentive_ratio, field_team_incentive_ratio, sales_team_labor_cost_ratio, sales_team_incentive_ratio, design_team_margin_ratio, field_team_margin_ratio, sales_team_margin_ratio) VALUES (20.00, 10.00, 20.00, 20.00, 10.00, 10.00, 20.00, 10.00, 0.00, 0.00, 0.00);

-- 월별 급여
CREATE TABLE IF NOT EXISTS monthly_salary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_salary (user_id, year, month)
);

-- 월별 매출
CREATE TABLE IF NOT EXISTS monthly_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  profit BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sales (year, month)
);

-- 월별 인센티브 배분
CREATE TABLE IF NOT EXISTS monthly_incentive (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_incentive (user_id, year, month)
);

-- 건별 매출
CREATE TABLE IF NOT EXISTS sales_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL,
  sale_date DATE NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  profit BIGINT NOT NULL DEFAULT 0,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_year_month (year, month)
);

-- 기존 monthly_sales 데이터 → sales_entries 이관 (amount > 0인 것만)
INSERT IGNORE INTO sales_entries (year, month, sale_date, amount, description)
SELECT year, month, CONCAT(year, '-', LPAD(month, 2, '0'), '-01'), amount, '기존 데이터 이관'
FROM monthly_sales
WHERE amount > 0;

-- 관리자 계정 생성 (비밀번호: admin123 → bcrypt 해시는 앱에서 생성)
