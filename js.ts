interface Array<T> { // без этого не работает find (ошибка TS2339: Property 'find' does not exist on type...)
    find(predicate: (value: T, index: number, obj: Array<T>) => boolean, thisArg?: any): T | undefined;
}

class User {
	
	private _userID: number;
	private _userName: string;
	private _userAvatar: string;

	constructor(id:number, userName:string, userAvatar:string) {
		this._userID = id;
		this._userName = userName;
		this._userAvatar = userAvatar; //URL
	}

	getUserID() {
		return this._userID;
	}
	
	getUserName() {
		return this._userName;	
	}
	
	getUserAva() {
		return this._userAvatar;	
	}

	setUserName(name: string) {
		this._userName = name;	
	}
	
	setUserAva(URL: string) {
		this._userAvatar = URL;	
	}

}

class Users {
	
	private _users: User[];
	
	constructor() {
		this._users = new Array;
	}

	addUser(user:User) {
		this._users.push(user);
	}

	getUserByID(id:number) {
		return this._users.find(user => user.getUserID() == id);
	}
}

class CommentAppender {
	
	private _commentBlock: HTMLElement;
	private _maxInputLength: number;
	private _parentCommentID: number;
	private _user: User;
	private _counterField: HTMLElement;
	private _button: HTMLButtonElement;
	private _inputField: HTMLInputElement;
	
	constructor(user:User, parentCommentID:number) {

		const template = <HTMLTemplateElement>document.getElementById('comment-form-template');
		this._commentBlock = template.content.cloneNode(true) as HTMLElement; //шаблон формы добавления комментариев

		this._maxInputLength = 1000;
		this._user = user;
		this._parentCommentID = parentCommentID;

		const userAva = <HTMLImageElement>this._commentBlock.querySelector('img');
		userAva.src = user.getUserAva();

		const userField = <HTMLElement>this._commentBlock.querySelector(".comment-username");
		userField.innerHTML = user.getUserName();
		
		this._counterField = <HTMLElement>this._commentBlock.querySelector('.comment-length');
		this._counterField.innerHTML = `Макс. ${this._maxInputLength} символов`;

		this._button = <HTMLButtonElement>this._commentBlock.querySelector('.comment-btn');
		this._button.disabled = true;
		this._button.onclick = this.buttonClick.bind(this);

		this._inputField = <HTMLInputElement>this._commentBlock.querySelector(".comment-input");
		this._inputField.oninput = this.inputHandler.bind(this);
	}

	
	inputHandler() {
		this._button.disabled = true;
		this._button.style.background = "#A2A2A2";
		if (this._inputField.value.length == 0) {
			this._counterField.innerHTML = `Макс. ${this._maxInputLength} символов`;
			this._counterField.classList.remove("red-color");
		}
		else {
			this._counterField.innerHTML = `${this._inputField.value.length}/${this._maxInputLength}`;
			if (this._inputField.value.length > this._maxInputLength) {
				this._counterField.innerHTML += " Слишком длинное сообщение";
				this._counterField.classList.add("red-color");
			} else {
				this._button.disabled = false;
				this._button.style.background = "#ABD873";
				this._counterField.classList.remove("red-color");
			}
		}
	}

	buttonClick() {
		const id = this.createNewCommentID();
		comments.addComment({user : this._user.getUserID(), text : this._inputField.value, parent : this._parentCommentID, id: id, time: new Date().getTime(), plus: 0, minus: 0});
		comments.save();
		comments.display(id);
		if (this._parentCommentID) {
			const comm1 = <HTMLElement>document.querySelector(`[data-id="${this._parentCommentID}"]`);
			const parent = <HTMLElement>comm1.querySelector(".commentresponses");
			parent.removeChild(<HTMLElement>parent.querySelector(".comment-form"));
		} else {
			this._inputField.value = "";
			this.inputHandler();
		}
	}

	getCommentNode() {
		return this._commentBlock;
	}

	createNewCommentID() {
		return Math.floor(Math.random() * 10000000);
	}
}

//Класс CommentRenderer отвечает за вывод одного комментария и обработку
//событий, возникающих при действиях пользователя
class CommentRenderer {
	private _user: User | undefined;
	private _text: string;
	private _parent: number;
	private _id: number;
	private _time: number;
	private _plus: number;
	private _minus: number;

	constructor(userId:number, text:string, parent:number, id:number, time:number, plus = 0, minus = 0) {
		
		this._user = users.getUserByID(userId);
		this._text = text;
		this._parent = parent;
		this._id = id;
		this._time = time;
		this._plus = (plus == undefined) ? 0 : plus;
		this._minus = (minus == undefined) ? 0 : minus;
	}

	display(favorites:Favorites) {
		
		const template = <HTMLTemplateElement>document.getElementById('comment-display-template');
		const commentBlockTemplate = template.content.cloneNode(true) as HTMLElement; // шаблон комментария
		const commentBlock = <HTMLElement>commentBlockTemplate.querySelector(".comment");
		commentBlock.dataset.id = String(this._id);
		const userAva = <HTMLImageElement>commentBlock.querySelector('img');
		if (this._user) {
			userAva.src = this._user.getUserAva();
			const userName = <HTMLElement>commentBlock.querySelector(".comment-username");
			userName.innerHTML = this._user.getUserName();
		}
		
		if (this._parent) {
			const opponent = <HTMLElement>commentBlock.querySelector(".comment-opponent");
			const opponentComment = <IComment>comments.getCommentById(this._parent);
			opponent.innerHTML = users.getUserByID(opponentComment.user)!.getUserName();
		}

		const time = new Date(this._time);
		const timeString = this.addLeadingZero(time.getDate()) + "." + this.addLeadingZero((time.getMonth() + 1)) + " " + this.addLeadingZero(time.getHours()) + ":" + this.addLeadingZero(time.getMinutes());
		const commTime = <HTMLElement>commentBlock.querySelector(".comment-time");
		commTime.innerHTML = timeString;
		const commText = <HTMLElement>commentBlock.querySelector(".comment-text");
		commText.innerHTML = this._text;
		const commReply = <HTMLElement>commentBlock.querySelector(".comment-reply");
		commReply.onclick = this.replyToComment.bind(this);
		if (this._parent) {	
			(<HTMLElement>(<HTMLElement>commentBlock).querySelector(".comment-response")).style.display = "none";
		}
		const favDiv = <HTMLAnchorElement>commentBlock.querySelector(".add-favorite");
		const scoreDiv = <HTMLElement>commentBlock.querySelector(".score-number");
		this.displayScore(scoreDiv);
		this.displayFav(favorites, favDiv);
		favDiv.onclick = this.switchFavorites.bind(this, favorites, favDiv);
		const minusDiv = <HTMLElement>commentBlock.querySelector(".score-minus");
		minusDiv.onclick = this.switchMinus.bind(this, scoreDiv);
		const plusDiv = <HTMLElement>commentBlock.querySelector(".score-plus");
		plusDiv.onclick = this.switchPlus.bind(this, scoreDiv);
		return commentBlock;
	}

	replyToComment(ev:Event) {
		const replyCommentAppender = new CommentAppender(currentUser, this._id);
		const comm1 = <HTMLElement>document.querySelector(`[data-id="${this._id}"]`);
		const parent = <HTMLElement>comm1.querySelector(".commentresponses");
		if (!parent.querySelector(".comment-form")) {
			parent.insertBefore(replyCommentAppender.getCommentNode(), parent.firstChild);
		}
	}

	switchFavorites(favorites:Favorites, favDiv:HTMLElement) {
		favorites.switchFav(this._user!.getUserID(), this._id);
		this.displayFav(favorites, favDiv);
	}

	switchMinus(scoreDiv:HTMLElement) {
		const change = scores.changeScore(currentUser.getUserID(), this._id, -1);
		this._minus += change.minus;
		this._plus += change.plus;
		this.displayScore(scoreDiv);
		this.saveScore();
	}

	switchPlus(scoreDiv:HTMLElement) {
		const change = scores.changeScore(currentUser.getUserID(), this._id, 1);
		this._minus += change.minus;
		this._plus += change.plus;
		this.displayScore(scoreDiv);
		this.saveScore();
	}

	displayScore(scoreDiv:HTMLElement) {
		const score = this._plus - this._minus;
		scoreDiv.innerHTML = String(score);
		if (score == 0) {
			scoreDiv.style.color = "lightgray";
		}
		else if (score < 0) {
			scoreDiv.style.color = "red";
		} else {
			scoreDiv.style.color = "green";
		}
	}

	saveScore() {
		const comment = <IComment>comments.getCommentById(this._id);
		comment.plus = this._plus;
		comment.minus = this._minus;
		comments.save();
	}

	displayFav(favorites:Favorites, favDiv:HTMLElement) {
		const parent = <HTMLElement>favDiv.parentElement;
		const heart = <HTMLImageElement>parent.querySelector(".heart");
		if (favorites.checkFav(this._user!.getUserID(), this._id) == -1) { // не найдено в избранном
			heart.src = "./images/favorite-none.svg";
			favDiv.innerHTML = "В избранное";
		} else {
			heart.src = "./images/favorite-fill.svg";
			favDiv.innerHTML = "В избранном";
		}
	}

	addLeadingZero(num:number) {
		return (num < 10)? "0" + num : "" + num;
	}

}

interface IComment {
	user : number,
	text : string,
	parent : number,
	id : number,
	time : number,
	plus : number,
	minus :number
}

class Comments {
	private _comments: IComment[];
	private _typeOfSort: string;

	constructor () {
		this._comments = new Array;
		this._typeOfSort = '0';
	}

	addComment(commentData:IComment) {
		this._comments.push(commentData);
	}

	save() {
		localStorage.setItem('comments', JSON.stringify(this._comments));
	}

	load() {
		const data = localStorage.getItem('comments');
		if(data) {
			const savedComments = JSON.parse(data);
		 	if (savedComments) {
				this._comments = savedComments;
		 	}
		}
	}

	setTypeOfSort(type:string) {
		this._typeOfSort = type;
	}

	displayAll(favorite:Favorites) {
		
		document.getElementById('comments-id')!.innerHTML = "";
		this._comments.sort(this.sortFunction.bind(this));
		if (!onlyFavorites) {
			this._comments.forEach(element => {
				if (element.parent == 0) {
					const comment = new CommentRenderer(element.user, element.text, element.parent, element.id, element.time, element.plus, element.minus);
					document.getElementById('comments-id')!.appendChild(comment.display(favorites));
				}
			});
			this._comments.forEach(element => {
				if (element.parent > 0) {
					const comment = new CommentRenderer(element.user, element.text, element.parent, element.id, element.time, element.plus, element.minus);
					const comm1 = document.querySelector(`[data-id="${element.parent}"]`);
					const parent = comm1!.querySelector(".commentresponses");
					parent!.appendChild(comment.display(favorites));
				}
			});
		} else { 
			// когда показываем избранное, то все комментарии должны отображаться в первом уровне
			// ведь коммент-ответ тоже может быть в избранном, при неизбранном родителе, и куда его тогда?
			this._comments.forEach(element => {
				if (favorites.checkFav(element.user, element.id) > -1) {
					const comment = new CommentRenderer(element.user, element.text, element.parent, element.id, element.time, element.plus, element.minus);
					document.getElementById('comments-id')!.appendChild(comment.display(favorites));
				}
			});
		}
		document.querySelector(".total-number")!.innerHTML = "(" + this._comments.length + ")";
	}

	sortFunction(a:IComment, b:IComment) {
		switch (this._typeOfSort) {

			case '1': // количество оценок
				return ((b.plus + b.minus) - (a.plus + a.minus)) * arrowState;
				break;
			case '2': // актуальность (наибольший рейтинг)
				return ((b.plus - b.minus) - (a.plus - a.minus)) *arrowState;
				break;
			case '3': // по количеству комментариев
				const countA = this._comments.filter((obj) => obj.parent === a.id).length;	
				const countB = this._comments.filter((obj) => obj.parent === b.id).length;
				return (countB - countA) * arrowState;
				break;
			default: // дата-время
				return (b.time - a.time) * arrowState;
		}
	}

	display(commentID:number) {
		const element = <IComment>this._comments.find(comment => comment.id == commentID);
		const comment = new CommentRenderer(element.user, element.text, element.parent, element.id, element.time, element.plus, element.minus);
		const elementToDisplay = comment.display(favorites);
		let parent;
		if (element.parent == 0) {
			parent = document.getElementById('comments-id');
		} else {
			parent = document.querySelector(`[data-id="${element.parent}"]`);
			parent = parent!.querySelector(".commentresponses");
		}
		parent!.insertBefore(elementToDisplay, parent!.firstChild);
	}

	getCommentById(id:number) {
		return this._comments.find(comment => comment.id == id);
	}
}

class Favorites {
	private _favorites: any[];

	constructor () {
		this._favorites = new Array;
	}

	checkFav(userId:number, commentId:number) {
		return this._favorites.indexOf(this._favorites.find(fav => (fav.userId == userId && fav.commentId == commentId)));
	}

	addFav(userId:number, commentId:number) {
		this._favorites.push({"userId":userId, "commentId":commentId});
		this.save();
	}

	removeFav(index:number) {
		this._favorites.splice(index, 1);
		this.save();
	}
	
	switchFav(userId:number, commentId:number) {
		const index = this.checkFav(userId, commentId);

		if (index == -1) {
			this.addFav(userId, commentId);
		} else {
			this.removeFav(index);
		}
	}

	save() {
		localStorage.setItem('favorites', JSON.stringify(this._favorites));
	}

	load() {
		const commentsFromStorage = localStorage.getItem('favorites');
		if (commentsFromStorage) {
			this._favorites = JSON.parse(commentsFromStorage);
		}
	}
}

class Scores {
	private _scores: any[];
	
	constructor() {
		this._scores = new Array;
	}

	load() {
		const scoresFromStorage = localStorage.getItem('scores');
		if (scoresFromStorage) {
			this._scores = JSON.parse(scoresFromStorage);
		}
	}

	save() {
		localStorage.setItem('scores', JSON.stringify(this._scores));
	}

	// Пользователь может изменить свою оценку - например, если он поставил плюс, а потом передумал,
	// то по клику на минус плюс аннулируется, после этого можно снова ставить или плюс или минус.
	// Тем не менее, два плюса или минуса, или одновременно плюс и минус поставить невозможно
	changeScore(userId:number, commentId:number, score:number) {
		const element = this._scores.find(data => (data[0] == userId && data[1] == commentId));
		let returnValue : {minus:number, plus:number};
		if (element) {
			if(element[2] == score) { // пользователь уже ставил такую оценку
				returnValue = {minus:0, plus: 0};
			} else { // пользователь решил изменить оценку, то есть убрать, например, свой плюс/минус, кликнув на противоположную				
				this._scores.splice(this._scores.indexOf(element), 1);
				if (score == -1) {
					returnValue = {minus:0, plus: -1};
				} else {
					returnValue = {minus:-1, plus: 0};
				}
			}
		} else {
			this._scores.push([userId, commentId, score]);
			if (score == -1) {
				returnValue = {minus:1, plus: 0};
			} else {
				returnValue = {minus:0, plus: 1};
			}
		}
		this.save();
		return returnValue;
	}
}

function changeIcon() {

	if (arrowState == 1) {

		(<HTMLElement>document.querySelector('.arrow-down')).style.display = 'none';
		(<HTMLElement>document.querySelector('.arrow-up')).style.display = 'block';
		arrowState = -1;
		comments.displayAll(favorites);

	} else {

		(<HTMLElement>document.querySelector('.arrow-down')).style.display = 'block';
		(<HTMLElement>document.querySelector('.arrow-up')).style.display = 'none';
		arrowState = 1;
		comments.displayAll(favorites);
	}
}

/* функция, при первом запуске создающая нескольких тестовых пользователей в локальном хранилище
или получающих их оттуда, если они уже созданы - вместо бэкэнда
*/
interface IUser {
	id: number;
	name: string;
	url: string;
}

function initTestData() {
	const usersFromStorage = localStorage.getItem('users');
	if (!usersFromStorage) {
		const userslist = ['Vasya', 'Theodor', 'Большой Брат', 'мяяяяяу!', 'X Æ A-12'];
		let id = 1;
		const usersArray = new Array;
		userslist.forEach(element => {
			fetch('https://picsum.photos/64')
			.then((response) => { usersArray.push({id: id++, name: element, url: response.url})})
			.then(() => {localStorage.setItem('users', JSON.stringify(usersArray))})
			.then(() => {if(usersArray.length == 5) {location.reload()}});
		});
 	} else {
		JSON.parse(usersFromStorage).forEach((element:IUser) => {
			users.addUser(new User(element.id, element.name, element.url))
		});
	}
}


const arrow = <HTMLElement>document.querySelector('.arrow');
let arrowState = 1;
let onlyFavorites = false;

arrow.addEventListener("click", changeIcon);

const users = new Users;

initTestData();
/***********************************************/
// здесь можно поменять текущего пользователя, указав ID от 1 до 5
/***********************************************/
const currentUser = <User>users.getUserByID(2);
/***********************************************/

const mainCommentForm = document.getElementById('comment-form-id'); //сюда вставляем основную форму добавления комментариев
const mainCommentAppender = new CommentAppender(currentUser, 0);
mainCommentForm!.appendChild(mainCommentAppender.getCommentNode());

const favorites = new Favorites;
favorites.load();

const scores = new Scores;
scores.load();

const comments = new Comments;
comments.load();
comments.displayAll(favorites);

const select = <HTMLSelectElement>document.querySelector(".select");
select.selectedIndex = 0; // firefox сохраняет последнее значение select и при обновлении страницы, ставит его, а мы хотим по умолчанию по дате
select!.addEventListener("change", function() {
	comments.setTypeOfSort(this.value);
	comments.displayAll(favorites);
});

const favLink = <HTMLElement>document.querySelector(".favorites");
favLink.addEventListener("click", function() {
	onlyFavorites = !onlyFavorites;
	if (onlyFavorites) {
		this.innerHTML = "Показать все";
	} else {
		this.innerHTML = "Избранное";
	}
	comments.displayAll(favorites);
});
