class Card{
    constructor(suit, rank){
        this.suit = suit;
        this.rank = rank;
    }

    getRankNumberBlackjack(){
        if(this.rank == "A") return 11;
        else if(this.rank == "J" || this.rank == "Q" || this.rank == "K"){
            return 10;
        }
        else return parseInt(this.rank);
    }
}

class Deck{
    constructor(gameType){
        this.gameType = gameType;
        this.cards = [];
        this.resetDeck();
    }

    shuffle(){
        for(let i = this.cards.length - 1; i >= 0; i--){
            let j = Math.floor(Math.random() * (this.cards.length - 1));
            let tempCard = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = tempCard;
        }
    }

    resetDeck(){
        this.cards = [];
        if(this.gameType == "Blackjack"){
            const SUIT = ["heart", "spade", "clover", "diamond"];
            const RANK = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
            for(let i = 0; i < SUIT.length; i++){
                for(let j = 0; j < RANK.length; j++){
                    this.cards.push(new Card(SUIT[i], RANK[j]));
                }
            }
        }
    }

    drawOne(){
        return this.cards.pop();
    }
}

class Player{
    constructor(name, type, gameType, chips = 400){
        this.name = name;
        this.type = type;
        this.gameType = gameType;
        this.chips = chips;
        this.hand = [];
        this.bet = 0;
        this.winAmount = 0;
        this.gameStatus = "betting";
    }

    promptPlayerBlackjack(userData){
        if(userData == "ai"){
            if(this.gameStatus == "betting"){
                if(this.chips == 0) return new GameDecision("bet", 0);
                if(this.chips <= 20) return new GameDecision("bet", 20);
                let betAmount = this.chips / 5;
                let random = Math.floor(Math.random() * 100);
                if(random % 2 == 0) betAmount += random;
                else betAmount -= random;

                let rest = betAmount;
                let hundred = Math.floor(rest / 100) * 100;
                rest = rest - hundred;
                let fifty = Math.floor(rest / 50) * 50;
                rest = rest - fifty;
                let twenty = Math.floor(rest / 20) * 20;
                rest = rest - twenty;
                let five = Math.floor(rest / 5) * 5;
                betAmount = hundred + fifty + twenty + five;


                if(betAmount <= 0) return new GameDecision("bet", 0);
                if(betAmount >= this.chips) return new GameDecision("bet", this.chips);
                return new GameDecision("bet", betAmount);
            }
            else if(this.gameStatus == "acting"){
                let random = Math.random();
                if(random < 0.05) return new GameDecision("surrender", this.bet);
                if(this.getHandScoreBlackjack() > 16 || (this.getHandScoreBlackjack() > 12 && random >= 0.6)){
                    return new GameDecision("stand", this.bet);
                }
                if(this.getHandScoreBlackjack() > 8 && this.getHandScoreBlackjack() < 12){
                    return new GameDecision("double", this.bet);
                }
                else{
                    return new GameDecision("hit", this.bet);
                }
            }
            else if(this.gameStatus == "hit"){
                if(this.getHandScoreBlackjack() >= 16){
                    return new GameDecision("stand", this.bet);
                }
                else return new GameDecision("hit", this.bet);
            }
            else return null;
        }
        if(userData == "user"){
            if(this.gameStatus == "betting"){
                let html = config.submitBtn.innerHTML;
                let betAmount = parseInt(html.substring(html.indexOf("$") + 1));
                if(betAmount > this.chips) betAmount = this.chips;
                View.bettingView("close");
                return new GameDecision("bet", betAmount);
            }
            else{
                return new GameDecision(this.gameStatus, this.bet);
            }
        }
        if(userData == "house"){
            if(this.gameStatus == "betting"){
                this.gameStatus = "waiting";
                return new GameDecision("wait", 0);
            }
            else if(this.gameStatus == "acting"){
                if(this.getHandScoreBlackjack() >= 16){
                    return new GameDecision("stand", this.bet);
                }
                else{
                    return new GameDecision("hit", this.bet);
                }
            }
            else if(this.gameStatus == "hit"){
                if(this.getHandScoreBlackjack() >= 16){
                    return new GameDecision("stand", this.bet);
                }
                else return new GameDecision("hit", this.bet);
            }
            else return null;
        }
    }

    getHandScoreBlackjack(){
        let total = 0;
        let ace = 0;
        for(let i = 0; i < this.hand.length; i++){
            let rank = this.hand[i].getRankNumberBlackjack();
            total += rank;
            if(this.hand[i].rank == "A") ace++;
        }
        while(total > 21 && ace > 0){
            total = total - 10;
            ace--;
        }
        if(total > 21) return 0;
        if(total == 21 && this.hand.length == 2) return 22;
        return total;
    }
}

class GameDecision{
    constructor(action, amount){
        this.action = action;
        this.amount = amount;
    }
}

class Table{
    constructor(gameType, betDenominations = [5, 20, 50, 100]){
        this.gameType = gameType;
        this.betDenominations = betDenominations;
        this.deck = new Deck(gameType);
        this.deck.shuffle();
        this.players = [];
        this.house = new Player("house", "house", gameType);
        this.players.push(this.house);
        this.gamePhase = "betting";
        this.resultLog = [];
        this.turnCounter = 0;
        this.roundCounter = 1;
        //this.blackjackAssignPlayerHands();
    }

    evaluateMove(player){
        let decision = player.promptPlayerBlackjack(player.type);
        if(decision == null) return;
        else if(decision.action == "bet"){
            player.bet = decision.amount;
            player.gameStatus = "acting";
        }
        else if(decision.action == "surrender"){
            player.winAmount = Math.floor(player.bet / 2) * -1;
            if(player.winAmount % 5 != 5) player.winAmount = Math.floor(player.winAmount / 5) * 5;
            player.gameStatus = "surrender";
        }
        else if(decision.action == "stand"){
            player.gameStatus = "stand";
        }
        else if(decision.action == "hit"){
            let card = this.deck.drawOne();
            player.hand.push(card);
            View.draw(player, card);
            player.gameStatus = "hit";
            if(player.getHandScoreBlackjack() == 0){
                player.gameStatus = "bust";
                player.winAmount = player.bet * -1;
            }
        }
        else if(decision.action == "double"){
            if(player.hand.length >= 3){
                return;
            }
            let card = this.deck.drawOne();
            player.hand.push(card);
            View.draw(player, card);
            player.gameStatus = "double";
            if(player.getHandScoreBlackjack() == 0){
                player.gameStatus = "doubleBust";
                player.winAmount = player.bet * -2;
            }
        }
        else if(decision.action == "blackjack"){
            player.gameStatus = "blackjack";
        }
        View.statusChange(player);
    }

    blackjackEvaluateAndGetRoundResults(){
        let string = `round ${this.roundCounter}: //`;
        let houseScore = this.house.getHandScoreBlackjack();
        for(let i = 0; i < this.players.length; i++){
            let current = this.players[i];
            let score = current.getHandScoreBlackjack();
            if(current.type == "house"){
                if(score == 22) current.gameStatus = "blackjack";
                continue;
            }
            if(current.gameStatus == "stand"){
                if(score > houseScore){
                    current.winAmount = current.bet;
                }
                else if(score < houseScore){
                    current.winAmount = current.bet * -1;
                }
                if(score == 22) current.gameStatus = "blackjack";
            }
            if(current.gameStatus == "double"){
                if(score > houseScore){
                    current.winAmount = current.bet * 2;
                }
                else if(score < houseScore){
                    current.winAmount = current.bet * -2;
                }
            }
            if(current.gameStatus == "blackjack"){
                if(houseScore < 22) current.winAmount = Math.floor(current.bet * 1.5);
                if(current.winAmount % 5 != 0) current.winAmount = Math.floor(current.winAmount / 5) * 5;
            }

            current.chips += current.winAmount;

            string += `name: ${current.name}, action: ${current.gameStatus}, bet: ${current.bet}, won: ${current.winAmount}//`;
        }
        this.roundCounter++;
        return string;
    }


    blackjackClearPlayerHandsAndBets(){
        for(let i = 0; i < this.players.length; i++){
            let current = this.players[i];
            current.bet = 0;
            current.hand = [];
            current.winAmount = 0;
            current.gameStatus = "betting";
            this.turnCounter = 0;
        }
        this.gamePhase = "betting";
        this.deck.resetDeck();
        this.deck.shuffle();
    }

    getTurnPlayer(){
        return this.players[this.turnCounter % this.players.length];
    }

    haveTurn(){
        let currentPlayer = this.getTurnPlayer();
        if(this.gamePhase == "betting"){
            this.evaluateMove(currentPlayer);
            if(this.onLastPlayer()){
                this.gamePhase = "acting";
            }
        }
        else if(this.gamePhase == "acting"){
            this.evaluateMove(currentPlayer);
            if(this.allPlayerActivesResolved() && this.house.gameStatus == "waiting"){
                if(this.getTurnPlayer() == this.house){
                    this.house.gameStatus = "acting";
                    View.statusChange(this.house);
                }
            }
            else if(this.allPlayerActivesResolved()){
                this.gamePhase = "roundOver";
                this.resultLog.push(this.blackjackEvaluateAndGetRoundResults());
            }
        }

        this.turnCounter++;
    }

    onFirstPlayer(){
        return this.turnCounter % this.players.length == 0;
    }

    onLastPlayer(){
        return this.turnCounter % this.players.length == this.players.length - 1;
    }

    allPlayerActivesResolved(){
        let count = 0;
        for(let i = 0; i < this.players.length; i++){
            let current = this.players[i];
            if(current.gameStatus == "stand" || current.gameStatus == "bust" || current.gameStatus == "doubleBust" || current.gameStatus == "double" || current.gameStatus == "surrender" || current.gameStatus == "waiting" || current.gameStatus == "blackjack"){
                count++;
            }
        }
        return count == this.players.length;
    }
}



const config = {
    suitUrl: "https://recursionist.io/img/dashboard/lessons/projects/",
    //heart.png
    homePage: document.getElementById("homePage"),
    gamePage: document.getElementById("gamePage"),
    betArea: document.getElementById("betArea"),
    nullArea: document.getElementById("nullArea"),
    submitBtn: document.getElementById("submitBet"),
    actingOptions: document.getElementById("actingOptions")
}

config.homePage.querySelectorAll("#startBtn")[0].addEventListener("click", function(){
    let gameType = document.getElementById("gameType").value;
    let userName = document.getElementById("userName").value;
    View.switchPage(config.homePage, config.gamePage);
    config.gamePage.querySelectorAll("#userNameValue")[0].innerHTML = userName;
    document.getElementById("user").id = userName;
    document.getElementById("AICards-result").id = userName+"Cards-result";
    document.getElementById("userCards").id = userName + "Cards";
    Controller.startNewGame(gameType, userName);
})

let gameCount = 0;

class View{
    static switchPage(prev, next){
        prev.classList.add("d-none");
        prev.classList.remove("d-block");
        next.classList.remove("d-none");
        next.classList.add("d-block");
    }

    static bettingView(openOrClose){
        if(openOrClose == "open"){
            View.switchPage(config.nullArea, config.betArea);
        }
        else{
            document.getElementById("five").value = "0";
            document.getElementById("ten").value = "0";
            document.getElementById("fifty").value = "0";
            document.getElementById("hundred").value = "0";
            config.submitBtn.innerHTML = `You Are Betting: $0`;
            View.switchPage(config.betArea, config.nullArea);
        }
    }

    static actingView(table, openOrClose){
        if(openOrClose == "open"){
            View.switchPage(config.nullArea, config.actingOptions);
            let user = table.getTurnPlayer();
            if(user.gameStatus == "hit" || user.gameStatus == "double"){
                document.getElementById("surrenderBtn").disabled = true;
                document.getElementById("doubleBtn").disabled = true;
            }
        }
        else{
            View.switchPage(config.actingOptions, config.nullArea);
            document.getElementById("surrenderBtn").disabled = false;
            document.getElementById("doubleBtn").disabled = false;
        }
    }

    static draw(player, card){
        let cardDiv = document.createElement("div");
        cardDiv.classList.add("bg-white", "card-size");
        if((player.name == "house" && player.hand.length > 1) || player.name == "ai1" || player.name == "ai2"){
            cardDiv.innerHTML += `
                <img src="https://www.you-meishi.com/koseiha/zoom/ayko005x_2x.jpg" height="80px">
            `
        }
        else {
            cardDiv.innerHTML += `
                <img src="https://recursionist.io/img/dashboard/lessons/projects/${card.suit}.png" height="50px">
                <p>${card.rank}</p>
            `
        }
        document.getElementById(player.name + "Cards").append(cardDiv);
    }

    static statusChange(player){
        let statusP = document.getElementById(player.name);
        if(player.type == "house") statusP.innerHTML = `S: ${player.gameStatus}`;
        else statusP.innerHTML = `S: ${player.gameStatus} B: ${player.bet} C: ${player.chips}`;
    }

    static changeAllStatus(table){
        for(let i = 0; i < table.players.length; i++){
            View.statusChange(table.players[i]);
        }
    }

    static appendResultLog(table, divName, gameOver = false, index = null){
        let resultArr = table.resultLog[table.resultLog.length - 1].split("//");
        if(gameOver) resultArr = table.resultLog[index].split("//")
        let resultDiv = document.createElement("div");
        resultDiv.classList.add("mt-4", "mb-4");
        for(let i = 0; i < resultArr.length; i++){
            resultDiv.innerHTML += `<p class="text-center text-white mb-0">${resultArr[i]}</p>`;
        }
        document.getElementById(divName).append(resultDiv);
    }

    static resultView(table){
        let players = table.players;
        for(let i = 0; i < players.length; i++){
            let current = players[i];
            let statusP = document.getElementById(current.name);
            let score = current.getHandScoreBlackjack();
            if(score == 22 || score == 0 || current.gameStatus == "surrender"){
                statusP.innerHTML = `<p style="font-size:20px">score: ${current.gameStatus}</p>`;
            }
            else statusP.innerHTML = `<p style="font-size:20px">score: ${score}</p>`;
            if(current.type != "house"){
                let plus = current.winAmount > 0 ? "+" : current.winAmount == 0 ? "±" : "";
                statusP.innerHTML += `<p style="font-size:15px">Win: ${plus}${current.winAmount}</p>`;
            }
        }
    }

    static openCards(table){
        for(let i = 0; i < table.players.length; i++){
            let current = table.players[i];
            let cardBox = document.getElementById(current.name + "Cards");
            cardBox.innerHTML = "";
            for(let j = 0; j < current.hand.length; j++){
                let cardDiv = document.createElement("div");
                cardDiv.classList.add("bg-white", "card-size");
                let card = current.hand[j];
                cardDiv.innerHTML += `<img src="https://recursionist.io/img/dashboard/lessons/projects/${card.suit}.png" height="50px" ><p>${card.rank}</p>`;
                cardBox.append(cardDiv);
            }
        }
    }

    static clearCardHtml(table){
        let players = table.players;
        for(let i = 0; i < players.length; i++){
            document.getElementById(players[i].name + "Cards").innerHTML = "";
        }
    }

    static gameOver(table){
        document.getElementById("resultLog").innerHTML = "";
        View.switchPage(config.gamePage, document.getElementById("gameOver"));
        for(let i = 0; i < table.players.length; i++){
            let current = table.players[i];
            if(current.type == "house") continue;
            let name = current.name;
            if(current.type == "user"){
                let name = current.name;
                document.getElementById("AI-result").innerHTML = name;
                name = "AI";
            }
            let cardBox = document.getElementById(name + "Cards-result");
            for(let j = 0; j < current.hand.length; j++){
                let card = current.hand[j];
                let cardDiv = document.createElement("div");
                cardDiv.classList.add("bg-white", "card-size-result");
                cardDiv.innerHTML = `
                    <img src="https://recursionist.io/img/dashboard/lessons/projects/${card.suit}.png" height="35px">
                    <p>${card.rank}</p>
                `;
                cardBox.append(cardDiv);
            }
        }
        for(let i = 0; i < table.resultLog.length; i++){
            View.appendResultLog(table, "gameOverLog", true, i);
        }
        View.restartNewGame(table);
        if(gameCount == 0){
            document.getElementById("newGameBtn").addEventListener("click", function(){
                View.switchPage(document.getElementById("gameOver"), config.gamePage);
                View.restoreGameOverPage(table);
                setTimeout(function(){Controller.startGame(table)}, 1000);
                gameCount++;
            })
        }
    }

    static restartNewGame(table){
        table.blackjackClearPlayerHandsAndBets();
        table.roundCounter = 1;
        table.resultLog = [];
        View.clearCardHtml(table);
        document.getElementById("okayBtnArea").classList.add("d-none");
        for(let i = 0; i < table.players.length; i++){
            table.players[i].chips = 400;
        }
        View.changeAllStatus(table);
    }

    static restoreGameOverPage(table){
        document.getElementById("gameOverLog").innerHTML = "";
        for(let i = 0; i < table.players.length; i++){
            let current = table.players[i];
            if(current.type == "house") continue;
            else if(current.type == "user") document.getElementById(`${current.name}Cards-result`).innerHTML = "";
            else document.getElementById(current.name + "Cards-result").innerHTML = "";
        }
    }
}


class Controller{

    static changeBet(denomination, plusOrMinus){
        let input = document.getElementById(denomination);
        if(plusOrMinus == "increase") input.value = parseInt(input.value) + 1;
        if(plusOrMinus == "decrease" && parseInt(input.value) >= 1) input.value = parseInt(input.value) - 1;

        let five = document.getElementById('five').value;
        let ten = document.getElementById('ten').value;
        let fifty = document.getElementById('fifty').value;
        let hundred = document.getElementById('hundred').value;
        let total = parseInt(five) * 5 + parseInt(ten) * 10 + parseInt(fifty) * 50 + parseInt(hundred) * 100;
        config.submitBtn.innerHTML = `You Are Betting: $${total}`;
    }

    static startGame(table){
        let bet = function(){
            if(table.getTurnPlayer().type == "user"){
                document.getElementById("userTurn").classList.remove("d-none");
            }
            if(table.getTurnPlayer().type == "user"){
                Controller.userBet(table);
                clearInterval(betInterval);
            }
            else table.haveTurn();
            if(table.gamePhase == "acting"){
                clearInterval(betInterval);
                Controller.giveInitialCards(table);
            }
        }
        let betInterval = setInterval(bet, 800);
    }

    static startNewGame(gameType, userName){
        let table = new Table(gameType);
        table.players.push(new Player("ai1", "ai", gameType));
        let user = new Player(userName, "user", gameType);
        if(userName == "AI") user.type = "ai";
        table.players.push(user);
        table.players.push(new Player("ai2", "ai", gameType));
        View.changeAllStatus(table);
        View.clearCardHtml(table);
        Controller.startGame(table);
    }

    static continueGame(table){
        table.blackjackClearPlayerHandsAndBets();
        View.clearCardHtml(table);
        View.changeAllStatus(table);
        Controller.startGame(table);
    }

    static giveInitialCards(table){
        let i = 1;
        let giveCards = function(){
            if(i >= table.players.length){
                for(let i = 0; i < 2; i++){
                    let card = table.deck.drawOne();
                    table.house.hand.push(card);
                    View.draw(table.house, card);
                }
                clearInterval(giveCardsInterval);
                Controller.acting(table);
            }
            else{
                let card = table.deck.drawOne();
                table.players[i].hand.push(card);
                View.draw(table.players[i], card);
                if(table.players[i].hand.length >= 2) i++;
            }
        };
        let giveCardsInterval = setInterval(giveCards, 500);
    }

    static acting(table){
        let action = function(){
            if(table.getTurnPlayer().type == "user" && (table.getTurnPlayer().gameStatus == "acting" || table.getTurnPlayer().gameStatus == "hit")){
                document.getElementById("userTurn").classList.remove("d-none");
            }
            if(table.getTurnPlayer().type == "user"){
                Controller.userAction(table);
                clearInterval(actionInterval);
            }
            else table.haveTurn();
            if(table.gamePhase == "roundOver"){
                clearInterval(actionInterval);
                Controller.roundOver(table);
            }
        };
        let actionInterval = setInterval(action, 1000);
    }

    static roundOver(table){
        document.getElementById("okayBtnArea").classList.remove("d-none");
        let okay = () => {
                document.getElementById("okayBtnArea").classList.add("d-none");
                Controller.continueGame(table);
        }
        if(gameCount == 0 && table.roundCounter == 2){
            document.getElementById("okayBtn").addEventListener("click", okay);
        }
        setTimeout(function(){
            View.resultView(table);
            View.openCards(table);
        }, 1000);

        View.appendResultLog(table, "resultLog");
        if(table.players[2].chips <= 0){
            document.getElementById("okayBtnArea").classList.add("d-none");
            setTimeout(function(){View.gameOver(table)}, 5000);
        }
    }

    static userBet(table){
        const betSubmition = () => new Promise(resolve => config.submitBtn.addEventListener("click", resolve));
        async function waitSubmition() {
            View.bettingView("open");
            await betSubmition();
            document.getElementById("userTurn").classList.add("d-none");
            table.haveTurn();
            Controller.startGame(table);
        }
        waitSubmition();
    }

    static userAction(table){
        let user = table.getTurnPlayer();
        if(user.gameStatus == "surrender" || user.gameStatus == "stand" ||  user.gameStatus == "bust" || user.gameStatus == "doubleBust" || user.gameStatus == "blackjack" || user.gameStatus == "double"){
            Controller.actionBtnClick(table, user.gameStatus);
            return;
        }
        const action = () => new Promise(resolve => document.getElementById("buttons").addEventListener("click", resolve));
        View.actingView(table, "open");
        async function actionSubmition() {
            await action().then(value => Controller.actionBtnClick(table, value.target.innerHTML));
            document.getElementById("userTurn").classList.add("d-none");
        }
        actionSubmition();
    }

    static actionBtnClick(table, actionType){
        if(actionType != "doubleBust") actionType = actionType.toLowerCase();
        table.getTurnPlayer().gameStatus = actionType;
        table.haveTurn();
        View.actingView("close");
        Controller.acting(table);
    }
}
