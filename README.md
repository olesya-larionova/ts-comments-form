# ts-comments-form

Для запуска на локальном компьютере:

$npm install
$npm run build

В браузере открыть файл index.html.

Так как отсутствует backend, то при первом запуске сформируется 5 тестовых пользователей для возможности добавления и оценки комментариев под разными пользователями.

Для смены пользователя в файле js.js (конечно, после сборки проекта) найти строку
const currentUser = users.getUserByID(2);
и поменять параметр на любое число от 1 до 5.

Или же можно поменять соответствующий параметр в строке 530 файла js.ts:
const currentUser = <User>users.getUserByID(2);
и пересобрать проект с помощью npm run build
