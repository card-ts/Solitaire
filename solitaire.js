// Selection and Drag Drop interactions under development

//clone partial element: https://codepen.io/Danny-Engelman/pen/bJozWZ

let ___DROPLOCATION_SCALE___ = 1.2;
let ___DROPLOCATION_COLOR___ = 'yellowgreen';

let draggingFromPile = false;   // DOM Element TablePileN
let draggingOverPile = false;   // DOM Element TablePileM
let dragMouseMove = false;      // Event handler
let dragMouseUp = false;        // Event handler

// random item from Array x OR beteen 0 and x value
let random = x => Array.isArray(x) ? x[random(x.length)] : 0 | x * Math.random();

let filterElementUnderCursor = (evt, name) => [...document.elementsFromPoint(evt.pageX, evt.pageY)].filter(el => el.nodeName.includes(name))[0];

let cardData = cid => {
    if (cid) {
        if (typeof cid != 'string') {
            console.warn('extract cid', typeof cid);
            cid = cid.getAttribute('cid');
        }
        let sequenceStart = 'K';            // King can start a new sequence on a Foundation
        let cardOrder = '0A23456789TJQK0';
        let rank = cid[0];
        let suit = cid[1];
        let isBase = sequenceStart.includes(rank);
        let reds = ['H', 'D'];
        let isRed = reds.includes(suit);
        let otherSuit = isRed ? ['S', 'C'] : reds;
        let idx = cardOrder.indexOf(rank);
        let higher = cardOrder[idx + 1];
        let lower = cardOrder[idx - 1];
        let upper = x => x.toUpperCase();
        let twoSuitCards = x => [x + otherSuit[0], x + otherSuit[1]];
        return {
            isBase,
            cid: upper(rank + suit),
            red: isRed,
            black: !isRed,
            color: isRed ? 'red' : 'black',
            isFoundation: rank == 'F',
            lowerSuits: twoSuitCards(lower),
            higherSuits: isBase ? ['FF'] : twoSuitCards(higher),
            lower: upper(lower + suit),
            higher: upper(higher + suit)
        };
    } else {
        console.warn('WTF?', cid);
    }
}

let showValidDropLocations = cardt => {
    let styleElement = DropLocations;
    [...styleElement.sheet.rules].map(() => styleElement.sheet.deleteRule(0));
    if (cardt) {
        let rule = (pileid, cid) => {
            let cssrule = `[id*="${pileid}"] CARDTS-CARD:last-child[cid="${cid}"] img{--cardBorderColor:${___DROPLOCATION_COLOR___};scale:${___DROPLOCATION_SCALE___}}`;
            //console.log(cssrule);
            return cssrule;
        };
        let data = cardData(cardt.id);
        let insertRule = x => DropLocations.sheet.insertRule(x);
        (data.higherSuits).map(cid => insertRule(rule('TablePile', cid)));
        insertRule(rule('FoundationPile', data.lower));
    }

};

let showCardBorderAndSequence = () => {
    let element = SelectionSequenceCards;
    document.addEventListener('mousemove', evt => {
        element.style.setProperty('--SelectionBorder', '4px dashed ' + (draggingFromPile ? 'transparent' : 'yellowgreen'));
        let card = filterElementUnderCursor(evt, 'CARDTS-CARD');
        if (card) {
            let rect = card.getBoundingClientRect();
            let left = evt.pageX - rect.left;
            let top = evt.pageY - rect.top;
            let width = rect.width;
            let cardZindex = getComputedStyle(card).zIndex - 1;
            let pile = filterElementUnderCursor(evt, 'ZONE');
            if (pile) {
                let lastrect = pile.lastChild.getBoundingClientRect();
                let height = lastrect.bottom - rect.top;
                element.style.setProperty('--SelectionBorderBoxLeft', evt.pageX - left);
                element.style.setProperty('--SelectionBorderBoxTop', evt.pageY - top);
                element.style.setProperty('--SelectionBorderBoxWidth', width);
                element.style.setProperty('--SelectionBorderBoxHeight', height);
                element.style.setProperty('--SelectionBorderBoxZindex', cardZindex);
            }
        }
    });
}
showCardBorderAndSequence();

let initDraggingPile = draggedElement => {
    draggingFromPile = draggedElement.closest('CARDTS-ZONE');   // closest ZONE is TablePileN
    draggingFromPile.classList.add('draggingFromPile');
    let pilecards = [...draggingFromPile.children];
    let cardnr = pilecards.indexOf(draggedElement);
    DraggingPile.append(...pilecards.slice(cardnr));
    DraggingPile.style.width = calculatedCardWidth;
    showValidDropLocations(DraggingPile.firstElementChild);
}
function handleDragStart(evt) {
    evt.preventDefault();

    if (false) {
        //replace dragging object with a Blank IMG
        evt.dataTransfer.setData('text/plain', '');
        var img = new Image();
        //img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        img.src = '../handleftright.png';
        img.style.width = '100px';
        document.body.appendChild(img);
        evt.dataTransfer.setDragImage(img, 100, 100);
        //img.remove();
    }
    initDraggingPile(this);

    dragMouseMove = document.addEventListener('mousemove', moveDraggingPile);
    dragMouseUp = document.addEventListener("mouseup", evt => {
        if (DraggingPile.children.length) {
            let dropElement = document.elementFromPoint(evt.pageX, evt.pageY);
            let releasePile = filterElementUnderCursor(evt, 'ZONE');
            if (releasePile) {
                console.log('dropped on', releasePile.id, dropElement.alt);
            } else {
                releasePile = draggingFromPile;
            }
            releasePile.append(...DraggingPile.children);
            let pileCardCount = releasePile.children.length;
            if (pileCardCount > 10) {
                let lastCard = releasePile.lastChild;
                if (lastCard.offsetHeight + lastCard.offsetTop > window.innerHeight) {
                    releasePile.style.setProperty('--TableOffsetY', 'calc(120px/' + pileCardCount / 5 + ')');
                }
                console.log(getComputedStyle(releasePile).getPropertyValue('--TableOffsetY'));
            }
            moveDraggingPile(false);
        }
        document.removeEventListener('mousemove', dragMouseMove);
        document.removeEventListener('mouseup', dragMouseUp);
    });
    window.e = evt;
    return false;
}

// document.addEventListener('mousedown', evt => {
//     let card = filterElementUnderCursor(evt, 'CARDTS-CARD');
//     if (card) {
//         let rect = card.getBoundingClientRect();
//         let left = evt.pageX - rect.left + 2;
//         let top = evt.pageY - rect.top;
//         DraggingPile.style.visibility = 'visible';
//         DraggingPile.style.left = evt.pageX - left;
//         DraggingPile.style.top = evt.pageY - top;
//     }
// });

let clearDraggingPileIndicator = () => {
    if (draggingOverPile) {
        draggingOverPile.classList.toggle('validDropPile', false);
        draggingOverPile.classList.toggle('notvalidDropPile', false);
    }
}
let dragCardLeft = false, dragCardTop = false;

let moveDraggingPile = evt => {
    let dragElement = DraggingPile;
    let clickedCard = false;
    let positionDraggingPile = () => {
        if (clickedCard) {
            dragElement.style.visibility = 'visible';
            dragElement.style.left = evt.pageX - dragCardLeft;
            dragElement.style.top = evt.pageY - dragCardTop;
            //console.log('dragging', evt.pageX, evt.pageY, clickedCard.id, dragCardLeft, dragCardTop);
            let card = filterElementUnderCursor(evt, 'CARDTS-CARD');
            if (card) {
                let cardZindex = getComputedStyle(card).zIndex + 1;
                //dragElement.style.rotate = (evt.movementX < 0 ? '-2' : '2') + 'deg';
                dragElement.style.zIndex = cardZindex;
            }
        }
    }
    if (evt && dragElement.children.length) {
        clickedCard = filterElementUnderCursor(evt, 'CARDTS-CARD');
        if (clickedCard && !dragCardLeft) {
            let clickCard_rect = clickedCard.getBoundingClientRect();
            dragCardLeft = evt.pageX - clickCard_rect.left + 2;
            dragCardTop = evt.pageY - clickCard_rect.top;
        }
        let overPile = filterElementUnderCursor(evt, 'ZONE');
        positionDraggingPile();
        //new pile?
        if (overPile && overPile.id !== draggingOverPile.id) {
            if (draggingOverPile) clearDraggingPileIndicator();
            draggingOverPile = overPile;
            let lastCard = cardData(draggingOverPile.lastChild.id);
            let firstCard = cardData(dragElement.firstElementChild.id);
            //pile type: Sequence , Foundation
            let validPile = (firstCard.isBase && lastCard.isFoundation) || lastCard.lowerSuits.includes(firstCard.cid);
            console.log(validPile, 'dragging over', draggingOverPile.id, firstCard.higherSuits);
            let className = (validPile ? '' : 'not') + 'validDropPile';
            draggingOverPile.classList.toggle(className, true);
        }
    } else {
        clearDraggingPileIndicator();
        dragElement.innerHTML = '';
        dragElement.style.visibility = 'hidden';
        draggingOverPile = false;
        if (draggingFromPile) draggingFromPile.classList.remove('draggingFromPile');
        draggingFromPile = false;
        showValidDropLocations(false);
    }
}

// card creator
let newCard = settings => {
    let cid = (typeof settings == 'string') ? settings : settings.rank + settings.suit;
    cid = cid.replace('10', 'T'); //10h-> TH
    let cardts_card = document.createElement('cardts-card');
    let cardt = document.createElement('card-t');
    cardts_card.setAttribute('cid', cid);
    cardts_card.setAttribute('id', cid);
    cardts_card.addEventListener('dragstart', handleDragStart, false);
    cardts_card.append(cardt);
    cardt.setAttribute('cid', cid);
    //    console.log(cardt.firstElementChild);
    return cardts_card;
}

// Fisher Yates shuffle
let shuffle = arr => {  // mutates original!
    let temp, rand, idx = arr && arr.length;
    while (idx) {
        rand = random(idx--);
        temp = arr[idx];
        arr[idx] = arr[rand];
        arr[rand] = temp;
    }
}

// let setBackground = (element, suit) => {
//     let img = CARDTS.card({ suit, rank: 1 });
//     element.style.backgroundImage = `url('${img.src}')`;
//     console.log(element.style, img.src);
// }
// setBackground(Spades, 0);
// setBackground(Hearts, 0);

//CardtsHeader.appendChild(CARDTS.cardString('CARDTS-SOLITAIRE'));

/* Play Solitaire **/

//create one deck of 52 cards
let ranks = ['A', 2, 3, 4, 5, 6, 7, 8, 9, '10', 'J', 'Q', 'K'];
let suits = ['S', 'H', 'D', 'C'];
let deck = suits.map(suit => ranks.map(rank => newCard({ suit, rank }))).flat();

//shuffle(deck);

//put whole deck in Stock
deck.forEach(card => {
    let newcard = Stock.appendChild(card);
    newcard.setAttribute('draggable', 'true');
});

let addCardToPile = (
    card,
    pile,
    before = false
) => {
    try {
        if (before) card = pile.insertBefore(card, before);
        else card = pile.appendChild(card);
        card.style.transform = `rotate(${random(6) - 3}deg) skewY(1deg)`;
    } catch (e) {
        console.error(e, '\n', card, pile);
    }
};
let getStockCard = (cardid = false, pile = Stock) => {
    let stockCards = Stock.get();// all cards in Stock
    let card = Stock.get()[stockCards.length - 1]; // last (top) card
    if (cardid) card = stockCards.filter(card => card.id == cardid)[0];
    if (typeof cardid == 'number') card = stockCards[cardid];
    return card;
}
let dealCard = (count, pile, before = false) => {
    while (count--) {
        let card = getStockCard();
        addCardToPile(card, pile, before);
    }
}

let initPiles = (
    pileNr,
    name,
    container,
    initFunc = () => { }
) => {
    let piles = [];
    let fragment = document.createDocumentFragment();
    while (pileNr) {
        let pile = document.createElement('CARDTS-ZONE');
        if (pile.children.length == 0) pile.appendChild(newCard('FF'));
        piles.push(fragment.insertBefore(pile, fragment.firstElementChild));
        initFunc(pile, pileNr);
        pile.id = name + pileNr--;
    }
    container.append(fragment);
    return piles;
};
initPiles(
    7,      // 8 piles
    'TablePile', // id Pile1, Pile2, ...
    TablePiles   // in Table DOM element
);

let pileNr = 1;
do {
    dealCard(pileNr, TablePiles.children[pileNr - 1]);// deal pileNr cards
} while (pileNr++ < 7);
//fill table

initPiles(
    4,
    'FoundationPile',
    TableFoundations,
    (pile, idx) => addCardToPile(
        newCard({ rank: 'F', suit: idx - 1 }), // use one Ace card as background
        pile,
        pile.firstElementChild
    )
);

dealCard(3, Waste);

//insert CSS rules creating offset for #Table sequence piles
let nth = 3;
let zindex = 4;
for (let idx = 1; idx < 53; idx++) {
    let selector = (id, nthChild) => `#${id} CARDTS-CARD:nth-child(${nthChild}){top: calc(${idx} * var(--TableOffsetY));z-index:${zindex}}`;
    nthCardSequence.sheet.insertRule(`${selector('DraggingPile', nth - 1, idx)}`); // pile has no FF base card
    nthCardSequence.sheet.insertRule(`${selector('TablePiles', nth, idx)}`);
    nth++;
    zindex += 2;
}

//add offset for Waste cards
let cardcount = 2;
nth = cardcount;
for (let idx = 1; idx < cardcount + 1; idx++) {
    let rule = `#Waste :nth-last-child(${nth--}){top: calc(${idx} * var(--TableOffsetY))}`;
    nthCardSequence.sheet.insertRule(rule);
}

let calculatedCardWidth = getComputedStyle(TablePile1.firstElementChild).width;

// window.oncontextmenu = (e) => {
//     e.preventDefault();
// }
// getStockCard().to(Pile1);