(() => {
  const $ = id => document.getElementById(id);
  const defaults = ['Asia/Shanghai', 'Asia/Colombo', 'Europe/London', 'America/New_York'];
  const names = {
    'Asia/Shanghai': '中国 · 北京', 'Asia/Colombo': '斯里兰卡 · 科伦坡',
    'Europe/London': '英国 · 伦敦', 'America/New_York': '美国 · 纽约'
  };
  const options = globalZones.map(row => ({
    zone: row.zone, label: names[row.zone] || row.country + ' · ' + row.city,
    keywords: [row.country, row.city, row.zone, row.code, names[row.zone]].join(' ').toLowerCase()
  })).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
  const byZone = new Map(options.map(option => [option.zone, option]));
  const key = 'cike.world-clocks.v1';
  const dialog = $('clock-dialog'), search = $('clock-search'), select = $('clock-zone');
  let selected = defaults.slice(), editIndex = -1, cards = [], previousFocus;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) selected = saved.filter(zone => byZone.has(zone));
  } catch {}
  function tick() {
    const now = new Date();
    for (const card of cards) {
      card.time.textContent = card.timeFormat.format(now);
      card.date.textContent = card.dateFormat.format(now);
    }
  }
  function render() {
    const container = $('clocks');
    container.replaceChildren();
    cards = selected.map((zone, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'clock';
      button.setAttribute('aria-label', '修改时钟：' + byZone.get(zone).label);
      button.innerHTML = '<span class="clock-name"></span><span class="clock-time"></span><span class="clock-date"></span><span class="clock-edit">修改</span>';
      button.querySelector('.clock-name').textContent = byZone.get(zone).label;
      button.onclick = () => open(index);
      container.append(button);
      return {
        button, time: button.querySelector('.clock-time'), date: button.querySelector('.clock-date'),
        timeFormat: new Intl.DateTimeFormat('en-GB', {timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'}),
        dateFormat: new Intl.DateTimeFormat('zh-CN', {timeZone: zone, month: 'long', day: 'numeric', weekday: 'short'})
      };
    });
    tick();
  }
  function filter(preferred) {
    const query = search.value.trim().toLowerCase();
    const matches = options.filter(option => option.keywords.includes(query));
    select.replaceChildren(...matches.map(option => new Option(option.label, option.zone)));
    if (matches.some(option => option.zone === preferred)) select.value = preferred;
    else select.selectedIndex = matches.length ? 0 : -1;
    $('save-clock').disabled = !matches.length;
    $('clock-feedback').textContent = matches.length ? '' : '没有找到匹配的城市。';
  }
  function open(index) {
    editIndex = index;
    previousFocus = document.activeElement;
    $('clock-dialog-title').textContent = index < 0 ? '新增时钟' : '修改时钟';
    $('remove-clock').hidden = index < 0;
    search.value = '';
    filter(selected[index] || 'Asia/Colombo');
    dialog.returnValue = '';
    dialog.showModal();
    search.focus();
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(selected)); } catch {}
    render();
    (cards[Math.min(editIndex < 0 ? cards.length - 1 : editIndex, cards.length - 1)]?.button || $('add-clock')).focus();
  }
  $('add-clock').onclick = () => open(-1);
  search.oninput = () => filter(select.value);
  $('remove-clock').onclick = () => dialog.close('remove');
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'remove' && editIndex >= 0) {
      selected.splice(editIndex, 1);
      save();
    } else if (dialog.returnValue === 'save' && byZone.has(select.value)) {
      if (editIndex < 0) selected.push(select.value);
      else selected[editIndex] = select.value;
      save();
    } else previousFocus?.focus();
  });
  render();
  setInterval(tick, 1000);
})();
