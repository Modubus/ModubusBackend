#!/bin/bash

### "chmod +x background-run-server.sh" - 실행 권한 부여 후 이 파일을 실행해주세요.
### 서버 백그라운드에서 실행
### 서버 종료: ps aux | grep node 명령어로 PID 찾아서 kill

./setup.sh
nohup npm run start &> server.log &