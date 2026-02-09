# Salang Project - 인건비 기반 매출 관리 시스템 기획서

## 1. 핵심 개념

```
전체 인건비(직원 급여 합산)
        ↓
목표매출 = 전체 인건비 ÷ 인건비율
        ↓
초과매출 = 실제매출 - 목표매출
        ↓
인센티브 총액 = 초과매출 × 인센티브율
        ↓
관리자가 직원별 수동 배분
```

**예시** (인건비율 20%, 인센티브율 10%)
| 항목 | 금액 |
|------|------|
| 직원 급여 합산 | 1,000만원 |
| 목표매출 | 1,000 ÷ 0.2 = **5,000만원** |
| 실제매출 | 6,000만원 |
| 초과매출 | 6,000 - 5,000 = **1,000만원** |
| 인센티브 총액 | 1,000 × 0.1 = **100만원** |

---

## 2. 사용자 역할

| 역할 | 권한 |
|------|------|
| **관리자(admin)** | 설정 변경, 직원 관리, 급여·매출 입력, 인센티브 배분, 전체 현황 조회 |
| **일반 직원(employee)** | 본인 급여·인센티브 조회만 가능 |

---

## 3. 주요 기능

### 3-1. 관리자 설정
- 인건비율 (%) 설정/변경
- 인센티브율 (%) 설정/변경

### 3-2. 직원 관리
- 직원 등록/수정/삭제 (이름, 직급, 입사일 등)
- 직원 계정 생성 (로그인용)

### 3-3. 월별 급여 입력
- 직원별 월 급여 입력
- 전체 인건비 자동 합산 표시
- → 목표매출 자동 계산 표시

### 3-4. 월별 매출 입력
- 월 실제매출액 수동 입력
- → 초과매출 자동 계산
- → 인센티브 총액 자동 계산

### 3-5. 인센티브 배분
- 인센티브 총액 확인
- 관리자가 직원별 인센티브 금액 수동 입력
- 배분 합계 ≤ 인센티브 총액 검증
- 미배분 잔액 표시

### 3-6. 대시보드 (관리자)
- 월별 요약 카드: 인건비 / 목표매출 / 실제매출 / 초과매출 / 인센티브
- 월별 매출 추이 차트 (Recharts)
- 최근 6~12개월 현황 테이블

### 3-7. 직원 마이페이지
- 본인 월별 급여 내역
- 본인 월별 인센티브 내역

---

## 4. 페이지 구성

```
/ .......................... 홈 (로그인 안내)
/login ..................... 로그인
/register .................. 회원가입 (관리자가 생성 또는 직원 자가가입)

/dashboard ................. 관리자 대시보드 (요약 + 차트)
/dashboard/settings ........ 인건비율·인센티브율 설정
/dashboard/employees ....... 직원 목록/관리
/dashboard/salary .......... 월별 급여 입력
/dashboard/sales ........... 월별 매출 입력
/dashboard/incentive ....... 인센티브 배분

/mypage .................... 직원 마이페이지 (급여·인센티브 조회)
```

---

## 5. DB 테이블 설계

### users (사용자)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT PK | |
| email | VARCHAR(255) UNIQUE | 로그인 이메일 |
| password | VARCHAR(255) | bcrypt 해시 |
| name | VARCHAR(100) | 이름 |
| role | ENUM('admin','employee') | 역할 |
| position | VARCHAR(100) | 직급 |
| hire_date | DATE | 입사일 |
| is_active | BOOLEAN DEFAULT TRUE | 활성 상태 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### settings (시스템 설정)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT PK | |
| labor_cost_ratio | DECIMAL(5,2) | 인건비율 (예: 20.00) |
| incentive_ratio | DECIMAL(5,2) | 인센티브율 (예: 10.00) |
| updated_at | TIMESTAMP | |

### monthly_salary (월별 급여)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT PK | |
| user_id | INT FK → users | 직원 |
| year | INT | 연도 |
| month | INT | 월 |
| amount | BIGINT | 급여액 (원) |
| created_at | TIMESTAMP | |

### monthly_sales (월별 매출)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT PK | |
| year | INT | 연도 |
| month | INT | 월 |
| amount | BIGINT | 실제 매출액 (원) |
| created_at | TIMESTAMP | |

### monthly_incentive (월별 인센티브 배분)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT PK | |
| user_id | INT FK → users | 직원 |
| year | INT | 연도 |
| month | INT | 월 |
| amount | BIGINT | 배분된 인센티브 (원) |
| created_at | TIMESTAMP | |

---

## 6. API 설계

```
POST   /api/auth/login            로그인
POST   /api/auth/register         회원가입

GET    /api/settings              설정 조회
PUT    /api/settings              설정 변경 (admin)

GET    /api/employees             직원 목록 (admin)
POST   /api/employees             직원 등록 (admin)
PUT    /api/employees/:id         직원 수정 (admin)
DELETE /api/employees/:id         직원 삭제 (admin)

GET    /api/salary?year=&month=   월별 급여 조회
POST   /api/salary                급여 일괄 저장 (admin)

GET    /api/sales?year=&month=    월별 매출 조회
POST   /api/sales                 매출 저장 (admin)

GET    /api/incentive?year=&month= 인센티브 조회
POST   /api/incentive             인센티브 배분 저장 (admin)

GET    /api/dashboard/summary     대시보드 요약 데이터
GET    /api/mypage                직원 본인 급여·인센티브 조회
```

---

## 7. 자동 계산 흐름 (프론트엔드)

```
[급여 입력 화면]
직원A 급여: 300만 ─┐
직원B 급여: 400만 ─┼→ 전체 인건비: 1,000만
직원C 급여: 300만 ─┘         ↓
                    인건비율: 20% (설정값)
                             ↓
                    목표매출: 5,000만 (자동표시)

[매출 입력 화면]
실제매출: 6,000만 입력
                    ↓
        초과매출: 1,000만 (자동계산)
        인센티브율: 10% (설정값)
                    ↓
        인센티브 총액: 100만 (자동계산)

[인센티브 배분 화면]
인센티브 총액: 100만
직원A: [  40만  ] ─┐
직원B: [  35만  ] ─┼→ 배분 합계: 100만 / 100만 ✓
직원C: [  25만  ] ─┘
```

---

## 8. 기술 스택 (확정)

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 프론트엔드 | React 19, Tailwind CSS 4, Radix UI |
| 차트 | Recharts |
| 백엔드 | Next.js API Routes |
| DB | MySQL (mysql2) - AWS Lightsail |
| 인증 | JWT + bcryptjs |
| 배포 | Vercel |
