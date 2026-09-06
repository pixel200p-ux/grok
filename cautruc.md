Cấu trúc
App tách 3 lớp: trang (routes) → UI → engine tính toán. Số liệu tài chính chỉ đi qua src/engine, UI không tự tính.
Trình duyệt > src/routes > src/components/pages > src/lib/api > "src/engine Replay" và "Postgres / PGLite"

Thư mục chính:
textgrok/
├── PORTFOLIO_SPEC_new.md          spec v3.1 (mới, chưa khớp hết code)
├── attachments/PORTFOLIO_SPEC_new.md   spec v3.0 (README đang trỏ)
├── package.json                   npm scripts, dependencies
├── vite.config.ts                 dev server
├── migrations/
│   ├── 0001_auth.sql              bảng đăng nhập
│   └── 0002_portfolio.sql         sổ cái: tài sản, lệnh, T+, Bank
└── src/
    ├── routes/                    URL
    │   ├── login.tsx              /login
    │   └── _app/                  app sau khi đăng nhập
    │       ├── index.tsx          /           Dashboard
    │       ├── dcds.tsx           /dcds
    │       ├── etf.tsx            /etf
    │       ├── stock.tsx          /stock
    │       ├── crypto.tsx         /crypto
    │       ├── bank.tsx           /bank
    │       ├── tplus.tsx          /tplus
    │       ├── reports.tsx        /reports
    │       └── settings.tsx       /settings
    ├── components/
    │   ├── pages/                 màn hình từng tab
    │   ├── forms/                 dialog Nạp vốn / Giao dịch / Bank
    │   ├── layout/AppShell.tsx    sidebar + header
    │   └── ui/                    button, card, table...
    ├── engine/                    lõi tính toán
    │   ├── replay.ts              rebuild holdings, P&L, T+
    │   ├── bank.ts                sổ tiết kiệm, tái tục
    │   ├── money.ts               parse giá 13.5 = 13.500₫
    │   └── types.ts
    └── lib/
        ├── api/portfolio.ts       ghi/đọc sổ cái
        ├── api/prices.ts          nút Cập nhật giá
        └── auth/                  đăng nhập