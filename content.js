
"use strict";

const defaultScrollingSpeed = 50;
const defaultStopScrollingByClick = true;

function getScrollingElement () {
  return document.scrollingElement ?
    document.scrollingElement : document.documentElement;
}

function getStopScrollingByClick() {
  return browser.storage.sync.set(
    { "stopScrollingByClick": defaultStopScrollingByClick }).catch(error);
}

function getScrollingSpeed () {
  return browser.storage.sync.set(
    { "scrollingSpeed": defaultScrollingSpeed }).catch(onError);
}

function setStopScrollingByClick(ev){

const autoScrolling = {
  speed: getScrollingSpeed()
  step: 1,
  tid: -1,
  scrollingElement: document.scrollingElement,
  start: function () {
    this.y = this.y + this.step;
    this.scrollingElement.scroll(this.x, this.y);
    this.tid = setTimeout(() => {
      this.start();
    }, 100 - this.speed);
  },
  stop: function () {
    clearTimeout(this.tid);
    this.tid = -1;
  },
  x: 0,
  y: 0,
  stopByClick: getStopScrollingByClick()
};

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.isScrolling) {
    autoScrolling.x = window.scrollX;
    autoScrolling.y = window.scrollY;
    autoScrolling.scrollingElement = getScrollingElement();
    autoScrolling.start();
  }
  else if (!msg.isScrolling && autoScrolling.tid !== -1) {
    autoScrolling.stop();
  }
});

browser.storage.onChanged.addListener((changes, area) => {
  var changedItems = Object.keys(changes);
  for (var item of changedItems) {
    if (item == "scrollingSpeed") {
      autoScrolling.speed = parseInt(changes[item]["newValue"]);
    }
    if (item == "stopScrollingByClick") {
      autoScrolling.stopByClick = changes[item]["newValue"];
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (ev) => {
    if (autoScrolling.tid !== -1 && autoScrolling.stopByClick == true) {
      autoScrollingStop();
      browser.runtime.sendMessage({"isScrolling": false}).catch(onError);
    }
  });
});

function onError(err) {
  console.log(`Error: ${err}`);
}
