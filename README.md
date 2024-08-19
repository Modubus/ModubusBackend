# 모두버스 Backend

모두버스 어플리케이션 백엔드 repository 입니다.

### how to run the server

1. 프로젝트 루트 디렉토리에서 `chmod +x ./scripts/*.sh` 명령어를 통해 스크립트 실행 권한을 부여합니다.
2. `./scripts/start.sh` 명령어로 스크립트를 실행합니다. 도커 컨테이너의 쉘로 진입됩니다.
3. 도커 컨테이너 내부의 쉘에서 `./scripts/run-server.sh` 스크립트를 실행합니다. 어플리케이션 실행을 위한 세팅 후 서버가 실행됩니다.
   3-1. 백그라운드에서 서버를 실행하려면 `./scripts/background-run-server.sh` 스크립트를 실행합니다. `server.log` 파일에 서버 로그가 저장됩니다.
