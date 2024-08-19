#!/bin/bash

### "chmod +x start.sh" - 실행 권한 부여 후 이 파일을 실행해주세요.
### Docker container의 쉘에 접속하기 위함

docker-compose up -d

docker exec -it modubus bash