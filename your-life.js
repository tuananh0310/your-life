/**
 * Interactive form and chart events / logic.
 * Premium Upgraded Version.
 */
(function () {
  var yearEl = document.getElementById('year'),
    monthEl = document.getElementById('month'),
    dayEl = document.getElementById('day'),
    unitboxEl = document.getElementById('unitbox'),
    targetYearEl = document.getElementById('targetYear'),
    lifespanEl = document.getElementById('lifespan'), // Expected lifespan input
    chartEl = document.querySelector('.chart'), // Chart list container
    unitText = document.querySelector('.unitbox-label').textContent.toLowerCase(),
    items = [], // Grid cell list items reference
    milestones = [], // Milestone array
    COLOR_ELAPSED = '#ef4444',          // Vibrant red — already lived
    COLOR_FUTURE = 'rgba(239,68,68,0.2)', // Faded red — future until target year
    KEY = {
      UP: 38,
      DOWN: 40
    };

  // Milestone manager DOM elements
  var milestoneTitleEl = document.getElementById('milestoneTitle'),
    milestoneAgeEl = document.getElementById('milestoneAge'),
    milestoneColorEl = document.getElementById('milestoneColor'),
    milestoneAddBtn = document.getElementById('milestoneAddBtn'),
    milestoneListEl = document.getElementById('milestoneList');

  // Stats Dashboard DOM elements
  var percentValEl = document.getElementById('statsPercentVal'),
    livedValEl = document.getElementById('statsLivedVal'),
    remainingValEl = document.getElementById('statsRemainingVal'),
    preciseAgeValEl = document.getElementById('statsPreciseAgeVal'),
    progressBarEl = document.getElementById('statsProgressBar');

  // Create Tooltip Element dynamically
  var tooltipEl = document.getElementById('custom-tooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'custom-tooltip';
    tooltipEl.className = 'custom-tooltip';
    document.body.appendChild(tooltipEl);
  }

  // Set listeners
  unitboxEl.addEventListener('change', _handleUnitChange);
  yearEl.addEventListener('input', _handleDateChange);
  yearEl.addEventListener('keydown', _handleUpdown);
  yearEl.addEventListener('blur', _unhideValidationStyles);
  monthEl.addEventListener('change', _handleDateChange);
  monthEl.addEventListener('keydown', _handleUpdown);
  dayEl.addEventListener('input', _handleDateChange);
  dayEl.addEventListener('blur', _unhideValidationStyles);
  dayEl.addEventListener('keydown', _handleUpdown);

  // Lifespan listener
  if (lifespanEl) {
    lifespanEl.addEventListener('input', _handleLifespanChange);
    lifespanEl.addEventListener('keydown', _handleUpdown);
    lifespanEl.addEventListener('blur', _unhideValidationStyles);
  }

  // Target year listeners
  if (targetYearEl) {
    targetYearEl.addEventListener('input', _handleDateChange);
    targetYearEl.addEventListener('keydown', _handleUpdown);
    targetYearEl.addEventListener('blur', _unhideValidationStyles);
  }

  // Milestone form listener
  if (milestoneAddBtn) {
    milestoneAddBtn.addEventListener('click', _handleAddMilestone);
  }

  // Tooltip event delegation on chart
  if (chartEl) {
    chartEl.addEventListener('mouseover', _handleChartMouseOver);
    chartEl.addEventListener('mousemove', _handleChartMouseMove);
    chartEl.addEventListener('mouseout', _handleChartMouseOut);
  }

  // Load default values & load Milestones
  _loadMilestones();
  _loadStoredValueOfDOB();

  // Event Handlers
  function _handleUnitChange(e) {
    window.location = '' + e.currentTarget.value + '.html';
  }

  function _handleLifespanChange(e) {
    var state = JSON.parse(localStorage.getItem("DOB")) || {};
    state.lifespan = lifespanEl.value;
    localStorage.setItem("DOB", JSON.stringify(state));

    _generateChart();
    _handleDateChange();
  }

  function _handleDateChange(e) {
    // Save date of birth, target year and lifespan in local storage
    var stateToSave = {
      month: monthEl.value,
      year: yearEl.value,
      day: dayEl.value,
      lifespan: lifespanEl ? lifespanEl.value : "90"
    };

    if (targetYearEl && targetYearEl.value) {
      stateToSave.targetYear = targetYearEl.value;
    }

    localStorage.setItem("DOB", JSON.stringify(stateToSave));

    if (_dateIsValid()) {
      var elapsedToNow = _calculateElapsedTimeToDate(new Date());
      var elapsedToTarget = null;

      // If target year is set and valid, calculate to that date too
      if (targetYearEl && targetYearEl.value && /^\d{4}$/.test(targetYearEl.value)) {
        var targetDate = new Date(parseInt(targetYearEl.value, 10), 0, 1);
        elapsedToTarget = _calculateElapsedTimeToDate(targetDate);
      }

      _repaintItems(elapsedToNow, elapsedToTarget);
    } else {
      _repaintItems(0, null);
    }
  }

  function _handleUpdown(e) {
    var newNum;
    var thisKey = e.keyCode || e.which;
    if (e.target.checkValidity()) {
      if (thisKey === KEY.UP) {
        newNum = parseInt(e.target.value, 10);
        e.target.value = newNum += 1;
        if (e.target.id === 'lifespan') {
          _handleLifespanChange();
        } else {
          _handleDateChange();
        }
      } else if (thisKey === KEY.DOWN) {
        newNum = parseInt(e.target.value, 10);
        e.target.value = newNum -= 1;
        if (e.target.id === 'lifespan') {
          _handleLifespanChange();
        } else {
          _handleDateChange();
        }
      }
    }
  }

  function _unhideValidationStyles(e) {
    e.target.classList.add('touched');
  }

  function _calculateElapsedTimeToDate(targetDate) {
    var dateOfBirth = _getDateOfBirth(),
      diff = targetDate.getTime() - dateOfBirth.getTime(),
      elapsedTime;

    // If target date is before birth, return 0
    if (diff < 0) {
      return 0;
    }

    switch (unitText) {
      case 'weeks':
        var elapsedYears = (new Date(diff).getUTCFullYear() - 1970);
        var isTargetBirthdayPassed = (targetDate.getTime() > new Date(targetDate.getUTCFullYear(), monthEl.value, dayEl.value).getTime());
        var birthdayYearOffset = isTargetBirthdayPassed ? 0 : 1;
        var dateOfLastBirthday = new Date(targetDate.getUTCFullYear() - birthdayYearOffset, monthEl.value, dayEl.value);
        var elapsedDaysSinceLastBirthday = Math.floor((targetDate.getTime() - dateOfLastBirthday.getTime()) / (1000 * 60 * 60 * 24));
        var elapsedWeeks = (elapsedYears * 52) + Math.floor(elapsedDaysSinceLastBirthday / 7);
        elapsedTime = elapsedWeeks;
        break;
      case 'months':
        elapsedTime = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.4375));
        break;
      case 'years':
        elapsedTime = (new Date(diff).getUTCFullYear() - 1970);
        break;
    }

    return elapsedTime;
  }

  function _dateIsValid() {
    return monthEl.checkValidity() && dayEl.checkValidity() && yearEl.checkValidity();
  }

  function _getDateOfBirth() {
    return new Date(yearEl.value, monthEl.value, dayEl.value);
  }

  function _generateChart() {
    if (!chartEl) return;

    // Clear existing lis (but preserve static axis divs)
    var lis = chartEl.querySelectorAll('li');
    for (var i = 0; i < lis.length; i++) {
      lis[i].remove();
    }

    var lifespan = parseInt(lifespanEl.value, 10) || 90;
    var totalItems = 0;

    if (unitText === 'weeks') {
      totalItems = lifespan * 52;
    } else if (unitText === 'months') {
      totalItems = lifespan * 12;
    } else if (unitText === 'years') {
      totalItems = lifespan;
    }

    var fragment = document.createDocumentFragment();
    for (var j = 0; j < totalItems; j++) {
      var li = document.createElement('li');
      li.setAttribute('data-index', j);
      fragment.appendChild(li);
    }
    chartEl.appendChild(fragment);

    // Update global reference
    items = chartEl.querySelectorAll('li');

    // If weeks.html, update the y-axis
    if (unitText === 'weeks') {
      _updateWeeksYAxis(lifespan);
    }
  }

  function _updateWeeksYAxis(lifespan) {
    var yAxisMarkersEl = document.querySelector('.weeks--y-markers');
    if (!yAxisMarkersEl) return;
    yAxisMarkersEl.innerHTML = '';

    for (var age = 0; age <= lifespan; age += 5) {
      var span = document.createElement('span');
      span.textContent = age;
      var topPercentage = (age / lifespan) * 100;
      span.style.top = topPercentage + '%';
      yAxisMarkersEl.appendChild(span);
    }

    // Append the final large age marker at the bottom right
    var finalSpan = document.createElement('span');
    finalSpan.className = 'final-age-marker';
    finalSpan.textContent = lifespan;
    yAxisMarkersEl.appendChild(finalSpan);
  }

  function _repaintItems(elapsedToNow, elapsedToTarget) {
    var totalItems = items.length;

    // Build a map of milestones for quick lookup
    var milestoneMap = {};
    for (var m = 0; m < milestones.length; m++) {
      var mile = milestones[m];
      var index = -1;
      if (unitText === 'weeks') {
        index = mile.age * 52;
      } else if (unitText === 'months') {
        index = mile.age * 12;
      } else if (unitText === 'years') {
        index = mile.age;
      }
      if (index >= 0 && index < totalItems) {
        milestoneMap[index] = mile;
      }
    }

    for (var i = 0; i < items.length; i++) {
      var li = items[i];
      li.style.backgroundColor = '';
      li.style.removeProperty('--milestone-color');
      li.className = '';

      if (milestoneMap[i]) {
        var mile = milestoneMap[i];
        li.classList.add('milestone-active');
        li.style.setProperty('--milestone-color', mile.color);
      } else if (i < elapsedToNow) {
        // Already lived — solid red
        li.style.backgroundColor = COLOR_ELAPSED;
      } else if (elapsedToTarget !== null && i < elapsedToTarget) {
        // Future until target year — faded red
        li.style.backgroundColor = COLOR_FUTURE;
      }

      // Highlight the "current" active item (representing where we are right now!)
      if (i === Math.floor(elapsedToNow) && i < totalItems) {
        li.classList.add('current-active');
      }
    }

    _updateStats(elapsedToNow, totalItems);
  }

  function _updateStats(elapsedToNow, totalItems) {
    if (!percentValEl) return;

    var percent = totalItems > 0 ? (elapsedToNow / totalItems) * 100 : 0;
    if (percent > 100) percent = 100;
    percentValEl.textContent = percent.toFixed(1) + '%';
    
    // Animate progress bar
    if (progressBarEl) {
      progressBarEl.style.width = percent.toFixed(1) + '%';
    }

    // Set counts
    var lived = Math.floor(elapsedToNow);
    var remaining = totalItems - lived;
    if (remaining < 0) remaining = 0;

    var unitLabel = unitText === 'weeks' ? 'tuần' : (unitText === 'months' ? 'tháng' : 'năm');
    livedValEl.textContent = lived.toLocaleString() + ' ' + unitLabel;
    remainingValEl.textContent = remaining.toLocaleString() + ' ' + unitLabel;

    // Calculate precise decimal age
    var dob = _getDateOfBirth();
    if (dob && !isNaN(dob.getTime())) {
      var ageDiff = new Date().getTime() - dob.getTime();
      var preciseAge = ageDiff > 0 ? ageDiff / (1000 * 60 * 60 * 24 * 365.25) : 0;
      preciseAgeValEl.textContent = preciseAge.toFixed(1) + ' tuổi';
    } else {
      preciseAgeValEl.textContent = '--';
    }
  }

  function _loadStoredValueOfDOB() {
    var DOB = JSON.parse(localStorage.getItem('DOB'));

    if (!DOB) {
      DOB = {
        month: "9",
        day: "3",
        year: "1998",
        lifespan: "80"
      };
      localStorage.setItem('DOB', JSON.stringify(DOB));
    }

    if (lifespanEl) {
      lifespanEl.value = DOB.lifespan || "80";
    }

    // Dynamic grid generation based on lifespan
    _generateChart();

    if (DOB.month >= 0 && DOB.month < 12) {
      monthEl.value = DOB.month;
    }

    if (DOB.year) {
      yearEl.value = DOB.year;
    }

    if (DOB.day > 0 && DOB.day < 32) {
      dayEl.value = DOB.day;
    }

    if (DOB.targetYear && targetYearEl) {
      targetYearEl.value = DOB.targetYear;
    }

    _handleDateChange();
  }

  // Tooltip event delegation handlers
  function _handleChartMouseOver(e) {
    var li = e.target.closest('li');
    if (!li || !items) return;

    var index = parseInt(li.getAttribute('data-index'), 10);
    if (isNaN(index)) return;

    var lifespan = parseInt(lifespanEl.value, 10) || 90;
    var dob = _getDateOfBirth();
    if (!dob || isNaN(dob.getTime())) return;

    var age = 0;
    var periodText = '';
    var dateEstText = '';

    if (unitText === 'weeks') {
      age = Math.floor(index / 52);
      var weekOfAge = (index % 52) + 1;
      periodText = 'Tuổi ' + age + ', Tuần ' + weekOfAge;
      var timeOffset = index * 7 * 24 * 60 * 60 * 1000;
      var cellDate = new Date(dob.getTime() + timeOffset);
      dateEstText = 'Tháng ' + (cellDate.getMonth() + 1) + '/' + cellDate.getFullYear();
    } else if (unitText === 'months') {
      age = Math.floor(index / 12);
      var monthOfAge = (index % 12) + 1;
      periodText = 'Tuổi ' + age + ', Tháng ' + monthOfAge;
      var cellDate = new Date(dob.getFullYear(), dob.getMonth() + index, 1);
      dateEstText = 'Tháng ' + (cellDate.getMonth() + 1) + '/' + cellDate.getFullYear();
    } else if (unitText === 'years') {
      age = index;
      periodText = 'Tuổi ' + age;
      dateEstText = 'Năm ' + (dob.getFullYear() + age);
    }

    var elapsedToNow = _calculateElapsedTimeToDate(new Date());
    var elapsedToTarget = null;
    if (targetYearEl && targetYearEl.value && /^\d{4}$/.test(targetYearEl.value)) {
      var targetDate = new Date(parseInt(targetYearEl.value, 10), 0, 1);
      elapsedToTarget = _calculateElapsedTimeToDate(targetDate);
    }

    var statusClass = 'future';
    var statusText = 'Tương lai';

    if (index === Math.floor(elapsedToNow)) {
      statusClass = 'elapsed';
      statusText = 'Hiện tại';
    } else if (index < elapsedToNow) {
      statusClass = 'elapsed';
      statusText = 'Đã sống';
    } else if (elapsedToTarget !== null && index < elapsedToTarget) {
      statusClass = 'future-target';
      statusText = 'Mục tiêu';
    }

    var milestoneAtCell = null;
    for (var m = 0; m < milestones.length; m++) {
      if (milestones[m].age === age) {
        var milestoneIndex = -1;
        if (unitText === 'weeks') milestoneIndex = milestones[m].age * 52;
        else if (unitText === 'months') milestoneIndex = milestones[m].age * 12;
        else milestoneIndex = milestones[m].age;

        if (index === milestoneIndex) {
          milestoneAtCell = milestones[m];
          break;
        }
      }
    }

    var html = '<div class="tooltip-title">' + periodText + '</div>';
    html += '<div class="tooltip-date">' + dateEstText + '</div>';
    html += '<span class="tooltip-status ' + statusClass + '">' + statusText + '</span>';

    if (milestoneAtCell) {
      html += '<div class="tooltip-milestone" style="--dot-color: ' + milestoneAtCell.color + '">';
      html += '<span class="milestone-color-dot" style="background-color: ' + milestoneAtCell.color + '; --dot-color: ' + milestoneAtCell.color + '"></span>';
      html += '<strong>' + milestoneAtCell.title + '</strong>';
      html += '</div>';
    }

    tooltipEl.innerHTML = html;
    tooltipEl.classList.add('visible');
  }

  function _handleChartMouseMove(e) {
    if (!tooltipEl.classList.contains('visible')) return;
    
    var x = e.pageX + 15;
    var y = e.pageY + 15;

    var tooltipWidth = tooltipEl.offsetWidth;
    var tooltipHeight = tooltipEl.offsetHeight;
    if (x + tooltipWidth > window.innerWidth + window.pageXOffset) {
      x = e.pageX - tooltipWidth - 15;
    }
    if (y + tooltipHeight > window.innerHeight + window.pageYOffset) {
      y = e.pageY - tooltipHeight - 15;
    }

    tooltipEl.style.left = x + 'px';
    tooltipEl.style.top = y + 'px';
  }

  function _handleChartMouseOut(e) {
    tooltipEl.classList.remove('visible');
  }

  // Milestones business logic
  function _loadMilestones() {
    var stored = localStorage.getItem('milestones');
    if (stored) {
      try {
        milestones = JSON.parse(stored);
      } catch (e) {
        milestones = [];
      }
    } else {
      milestones = [
        { title: 'Chào đời 👶', age: 0, color: '#10b981' },
        { title: 'Tốt nghiệp Đại học 🎓', age: 22, color: '#3b82f6' }
      ];
      localStorage.setItem('milestones', JSON.stringify(milestones));
    }
    _renderMilestoneList();
  }

  function _renderMilestoneList() {
    if (!milestoneListEl) return;
    milestoneListEl.innerHTML = '';

    milestones.sort(function (a, b) {
      return a.age - b.age;
    });

    for (var i = 0; i < milestones.length; i++) {
      var mile = milestones[i];
      var li = document.createElement('div');
      li.className = 'milestone-item';
      li.innerHTML = '<div class="milestone-item-info">' +
        '<span class="milestone-color-dot" style="background-color: ' + mile.color + '; --dot-color: ' + mile.color + '"></span>' +
        '<span>Tuổi ' + mile.age + ': ' + mile.title + '</span>' +
        '</div>' +
        '<button class="milestone-delete-btn" data-index="' + i + '">✕</button>';
      milestoneListEl.appendChild(li);
    }

    var deleteBtns = milestoneListEl.querySelectorAll('.milestone-delete-btn');
    for (var j = 0; j < deleteBtns.length; j++) {
      deleteBtns[j].addEventListener('click', _handleDeleteMilestone);
    }
  }

  function _handleAddMilestone(e) {
    e.preventDefault();
    if (!milestoneTitleEl || !milestoneAgeEl || !milestoneColorEl) return;

    var title = milestoneTitleEl.value.trim();
    var age = parseInt(milestoneAgeEl.value, 10);
    var color = milestoneColorEl.value;

    if (!title || isNaN(age) || age < 0 || age > 150) {
      alert('Vui lòng điền thông tin cột mốc hợp lệ (Tuổi từ 0 đến 150)!');
      return;
    }

    milestones.push({
      title: title,
      age: age,
      color: color
    });

    localStorage.setItem('milestones', JSON.stringify(milestones));
    _renderMilestoneList();

    milestoneTitleEl.value = '';
    milestoneAgeEl.value = '';

    _handleDateChange();
  }

  function _handleDeleteMilestone(e) {
    var index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
    if (isNaN(index)) return;

    milestones.splice(index, 1);
    localStorage.setItem('milestones', JSON.stringify(milestones));
    _renderMilestoneList();

    _handleDateChange();
  }
})();
