# 카카오톡 클론 코딩

혼자서 서버까지 완성하는 풀스택 프로젝트를 진행하고 싶어서 주제를 찾던 와중, socket.io를 사용하는 실시간 채팅에 눈길이 갔습니다.
가장 대중적인 메신저 앱인 카카오톡을 참고하여, 프로젝트를 진행했습니다.

이 레포지토리는 프로젝트의 Server 부분입니다.

## 사용 기술

- React
- Typescript
- Axios
- Styled-components
- Redux
- Socket.io

## 실행 방법

```
// 프로젝트 클론
git clone https://github.com/dldnjswns31/Livetalk_server.git
cd Livetalk_server

// .env 파일 생성 후 내용 작성
SERVER_PORT=포트번호
MONGODB_URI=개인 mongoDB URI
JWT_SALT=임의의 문자열
BCRYPT_SALT_ROUNDS=임의의 숫자

// 패키지 설치 후 실행
npm i
npm start
```
