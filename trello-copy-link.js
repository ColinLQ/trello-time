(function() {

  var btn = document.createElement('a');
  btn.className = 'button-link'
  btn.innerHTML = '<span class="icon-sm icon-copy"></span>';

  var btnText = document.createElement('span');
  btnText.innerHTML = 'Copy Link';
  btn.append(btnText);

  btn.addEventListener('click', function(e) {
    e.preventDefault();
    var input = document.createElement('input');
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

  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null;

  var observer = new MutationObserver(function(mutations) {
    var copyBtn = document.querySelector('.js-copy-card');
    if (!copyBtn) { return ; }
    copyBtn.after(btn);
  })

  observer.observe(document.querySelector('.js-tab-parent'), { childList: true });
})()
