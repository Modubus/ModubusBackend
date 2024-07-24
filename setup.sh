#!/bin/bash

### "chmod +x start.sh" - 실행 권한 부여 후 이 파일을 실행해주세요.

cp .env.development .env
npx prisma generate