const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null;

function debounce(fn, interval = 200) {
  var timer = null, prev = 0, context, args

  function later () {
    var now = new Date().getTime()
    // 计算是否在时间间隔内来判断是重置还是执行业务函数
    if (now - prev < interval) {
      timer = setTimeout(later, interval || 0)
    } else {
      timer = null
      clearTimeout(timer)
      fn.apply(context, args)
    }
  }

  return function () {
    context = this
    args = arguments
    prev = new Date().getTime()
    // 第一次开启或已经经过一次去抖后
    if (!timer) {
      timer = setTimeout(later, interval || 0)
    }
  }
}

// 生成复制按钮
function createCopyLink() {
  const btn = document.createElement('a');
  btn.className = 'button-link'
  btn.innerHTML = '<span class="icon-sm icon-copy"></span>';

  const btnText = document.createElement('span');
  btnText.innerHTML = 'Copy Link';
  btn.append(btnText);

  btn.addEventListener('click', function(e) {
    e.preventDefault();
    const input = document.createElement('input');
    input.value = decodeURI(location.href);
    document.body.appendChild(input)
    input.select();
    document.execCommand('copy')
    document.body.removeChild(input);
    btnText.innerHTML = 'Copy Success'
    setTimeout(function() {
      btnText.innerHTML = 'Copy Link'
    }, 1000)
  })

  return btn;
}

function createPicker() {
  const $picker = $('<div class="picker"><span class="picker-title">Estimated Points</span></div>');
  [0.5,1,2,3,4,5,6,7,8].forEach(item => {
    $picker.append($(`<span class="point-value">${item}</span>`));
  });
  $picker.on('click', '.point-value', function() {
    const time = $(this).text();
    const $title = $('.window-title .js-card-detail-title-input')
    let text = $title.val();
    const reg = /^\(([^\)\(]*?)\)/;
    text = text.replace(reg, '');
    text = `(${time})${text}`;
    $title.val(text);
    $title.click();
    $title.focus();
  })
  return $picker;
}

// 设置卡片背景色
function setCardBackgroundColor($card) {
  const color = $card.find('.card-label').css('background-color');
  if (!color) { return; }
  colorArray = color.replace(/rgb(a)?\(|\)/g, '').split(',');
  if (colorArray.length === 3) {
    colorArray.push(0.4);
  } else if (colorArray.length === 4) {
    colorArray[3] -= colorArray[3] / 2;
  }
  $card.css('background-color', `rgba(${colorArray.join(',')})`);
  setBadgesBackgroundColor($card);
}

// 设置 badges 背景
function setBadgesBackgroundColor($card) {
  const $badges = $card.find('.badges');
  $card.find('.badges').css({
    'background-color': 'rgba(255, 255, 255, 0.5)',
    'border-radius': '3px',
  })
}

// card 的 title 改变时触发
function cardTitleChange($title) {
  if (!$title[0]) {return;}
  const $card = $title.parents('.list-card');

  const title = $title[0].childNodes.length > 1 ? $title[0].childNodes[$title[0].childNodes.length - 1] : $title[0];
  let titleTextContent = title.textContent;
  const reg = /^\(([^\)\(]*?)\)/;
  const titleMatch = titleTextContent.match(reg) || [];
  let time;
  if (titleMatch.length >= 2) {
    time = parseFloat(titleMatch[1]);
    if (isNaN(time)) { return }
    titleTextContent = titleTextContent.replace(titleMatch[0], '');
    title.textContent = titleTextContent;
  }

  if (time) {
    const $originBadge = $card.find('.js-badge-time');
    if ($originBadge[0]) {
      $originBadge.text(time);
    } else {
      const $badge = $(`<div class="badge js-badge-time">${time}</div>`);
      $badge.css({
        color: '#fff',
        borderRadius: '3px',
        minWidth: '24px',
        textAlign: 'center',
        backgroundColor: 'rgb(0, 101, 128)',
      });
      $card.find('.badges').append($badge);
    }
  }
}

function observerDom(dom, callBack) {
  if (!dom || dom.dataset.isObserve) { return ;}
  const observer = new MutationObserver(callBack)
  observer.observe(dom, { childList: true });
  dom.dataset.isObserve = true;
}

// 监听整个面板，新增或者删除 list 触发 listChange()
function observerBoard() {
  const board = $('#board')[0];
  observerDom(board, function(mutationsList) {
    init();
    addReInitBtn();
  })
}

// 添加 list 顶部 总计 dom
function getTotalDom($list) {
  $list = $list.hasClass('js-list') ? $list : $list.parents('.js-list');
  // 防止重复添加
  let $points = $list.find('.list-total .points');
  if ($points[0]) { return $points; }

  const $listTotal = $('<span class="list-total"></span>');
  $points = $('<span class="points"></span>')
  $listTotal.append($points);
  $list.find('.js-list-header').append($listTotal);
  return $points;
}

// 更新list时间总数
function updataListTotal($list) {
  let total = 0;
  $list.find('.js-badge-time').each(function() {
    total += Number(this.textContent);
  })
  getTotalDom($list).text(total);
}

const listChangeDoms = new Set();
const addedDom = new Set();

const listChangeDebounce = debounce(function(){
  addedDom.forEach(item => {
    const $card = $(item);
    const $title = $card.find('.js-card-name')
    if ($title[0]) {
      setCardBackgroundColor($card)
      cardTitleChange($title)
      // 监听新添加 card 的 title
      observeTitle($title);
    }
  });
  addedDom.clear();
  listChangeDoms.forEach(item => {
    // 重新计算 list 时间总数
    updataListTotal($(item));
  })
  listChangeDoms.clear();
})

// 监听整个list, 新增或删除 card 时，触发 listCardChange()
function observerList($list) {
  observerDom($list[0], function(mutationsList) {
    mutationsList.map(item => {
      listChangeDoms.add(item.target);
      Array.prototype.map.call(item.addedNodes, node => {
        addedDom.add(node)
      })
    })
    listChangeDebounce()
  })
}

// 监听 card 的title 变化，触发 cardTitleChange()
function observeTitle($title) {
  observerDom($title[0], function() {
    cardTitleChange($title)
    updataListTotal($title.parents('.js-list'));
  })
}

function init() {
  observerBoard();
  $('#board .js-list').each(function() {
    const $list = $(this).find('.js-list-cards')
    observerList($list)
    $list.each(function() {
      const $titles = $(this).find('.js-card-name');
      $titles.each(function() {
        const $title = $(this);
        setCardBackgroundColor($title.parents('.list-card'))
        cardTitleChange($title);
        observeTitle($title);
      })
    })
    updataListTotal($list);
  })
}

function observerTabParent() {
  const copyLinkBtn = createCopyLink();
  const $picker = createPicker();
  const observer = new MutationObserver(function(mutations) {
    const copyCardBtn = document.querySelector('.js-copy-card');
    $('.window-header').append($picker);
    if (copyCardBtn) {
      copyCardBtn.after(copyLinkBtn);
    }
  })
  observer.observe(document.querySelector('.js-tab-parent'), { childList: true });
}

function addReInitBtn() {
  const btn = $('<div class="mod-left board-header-btn board-header-btn-invite board-header-btn-without-icon board-header-btn-text js-init-btn">Init Time</div>').click(init);
  const $boardHeader = $('.js-board-header');
  if (!$boardHeader.find('.js-init-btn')[0]) {
    $('.js-board-header').append(btn)
  }
}

init();

$(function() {
  observerTabParent();
  init();
  addReInitBtn();
})

