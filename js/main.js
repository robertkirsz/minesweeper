$(function () {
  var $liczbaBomb = $('#liczbaBomb')
  var liczbaBomb = 15
  var liczbaOznaczonychBomb = 0
  var skokBomb = 40 / liczbaBomb
  var lumberOfColumns = 10
  var numberOfFields = lumberOfColumns * lumberOfColumns
  var $bomby = null
  var $minuty = $('#czas .minuty')
  var $sekundy = $('#czas .sekundy')
  var touchTimeout = null
  var $aside = $('aside')
  var mobileTimer

  const $body = $('body')
  const $grid = $('#grid')
  const $reset = $('.reset')

  $liczbaBomb.text(liczbaBomb)

  function generateGrid() {
    for (var i = 0; i < numberOfFields; i++) {
      $grid.append($('<div class="zakryte" />'))
    }

    $grid.css('grid-template-columns', `repeat(${lumberOfColumns}, 1fr)`)
    $grid.css('grid-template-rows', `repeat(${lumberOfColumns}, 1fr)`)
  }

  generateGrid()

  const $pola = $('#grid > div')

  var zegar = {
    sekundy: 0,
    minuty: 0,
    licznik: null,
    start: function () {
      zegar.licznik = setInterval(function () {
        zegar.sekundy = parseInt(++zegar.sekundy)
        zegar.sekundy = zegar.sekundy < 10 ? '0' + zegar.sekundy : zegar.sekundy
        $sekundy.text(zegar.sekundy)
        if (zegar.sekundy > 59) {
          zegar.sekundy = 0
          $minuty.text(++zegar.minuty)
          $sekundy.text('00')
        }
      }, 1000)
    },
    stop: function () {
      clearInterval(zegar.licznik)
    },
    zeruj: function () {
      clearInterval(zegar.licznik)
      zegar.sekundy = 0
      zegar.minuty = 0
      $sekundy.text('00')
      $minuty.text('0')
    }
  }

  function win() {
    $grid.css('pointer-events', 'none')
    zegar.stop()
    $('.fa-flag').remove()
    kolorTla(100, 80)

    $bomby.each(function () {
      if ($(this).hasClass('zaznaczone')) {
        //..na zielono, jeśli zostały zaznaczone
        $(this).removeClass('zaznaczone').addClass('dobrze').prepend('<span class="fa fa-check"></span>')
      }
    })
  }

  function lose() {
    $('.fa-flag').remove()

    $bomby.each(function () {
      if (isFlag(this)) {
        removeFlag(this)
        putCheckmark(this)
      } else {
        putBomb(this)
      }
    })

    $pola.filter('.zaznaczone').prepend('<span class="fa fa-times"></span>')

    $pola
      .filter('.zakryte')
      .not('.zaznaczone')
      .removeClass('zakryte')
      .addClass('odkryte')
      .each((_, element) => {
        const numberOfBombs = $(element).data('number')
        if (numberOfBombs > 0) $(element).text(numberOfBombs)
      })

    $grid.css('pointer-events', 'none')
    kolorTla(0, 60)
    zegar.stop()
  }

  function checkGame() {
    const hasAllBombsMarked = $bomby.filter('.zaznaczone').length === liczbaBomb
    const hasNoUncoveredFields = $pola.filter('.zakryte').not('.zaznaczone').length === 0

    if (hasAllBombsMarked && hasNoUncoveredFields) win()
  }

  function kolorTla(hue, saturation) {
    $body.css('background-color', 'hsla(' + hue + ', ' + saturation + '%, 70%, 0.5')
  }

  const neighbors = indexInRow => index => index >= indexInRow - 1 && index <= indexInRow + 1

  function around(index) {
    if (index < 0) return $()

    const currentRowIndex = Math.floor(index / lumberOfColumns)
    const upperRowIndex = currentRowIndex - 1
    const lowerRowIndex = currentRowIndex + 1

    const currentRowStart = currentRowIndex * lumberOfColumns
    const upperRowStart = upperRowIndex * lumberOfColumns
    const lowerRowStart = lowerRowIndex * lumberOfColumns

    const currentRowEnd = currentRowStart + lumberOfColumns
    const upperRowEnd = upperRowStart + lumberOfColumns
    const lowerRowEnd = lowerRowStart + lumberOfColumns

    const indexInCurrentRow = index - lumberOfColumns * currentRowIndex

    const upperRow = $pola.slice(upperRowStart, upperRowEnd).filter(neighbors(indexInCurrentRow))
    const currentRow = $pola.slice(currentRowStart, currentRowEnd).filter(neighbors(indexInCurrentRow))
    const lowerRow = $pola.slice(lowerRowStart, lowerRowEnd).filter(neighbors(indexInCurrentRow))

    return upperRow.add(currentRow).add(lowerRow)
  }

  function isBomb(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    return $field.data('rodzaj') === 'bomba'
  }

  function putBomb(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    $field.addClass('bomba').prepend('<span class="fa fa-bomb" />')
  }

  function isFlag(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    return $field.hasClass('zaznaczone')
  }

  function putCheckmark(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    $field.addClass('dobrze').prepend('<span class="fa fa-check" />')
  }

  function putFlag(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    $field.addClass('zaznaczone').prepend('<span class="fa fa-flag" />')
  }

  function removeFlag(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    $field.removeClass('zaznaczone').find('.fa-flag').remove()
  }

  function odkryjPole(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    if (isBomb($field)) return lose()

    if (isFlag($field)) return removeFlag($field)

    $field.removeClass('zakryte').addClass('odkryte')

    const numberOfBombs = $field.data('number')

    if (numberOfBombs === 0) {
      around($field.index())
        .filter('.zakryte')
        .each((_, element) => !isBomb(element) && odkryjPole(element))
    } else if (numberOfBombs > 0) $field.text(numberOfBombs)
  }

  function generateRandom(min, max, wykluczona) {
    var num = Math.floor(Math.random() * (max - min + 1)) + min
    return num === wykluczona ? generateRandom(min, max, wykluczona) : num
  }

  function generateNumbers() {
    $pola
      .filter((_, element) => $(element).data('rodzaj') !== 'bomba')
      .each((_, element) => {
        const numberOfSurroundingBombs = around($(element).index()).filter(
          (_, element) => $(element).data('rodzaj') === 'bomba'
        ).length

        $(element).data('number', numberOfSurroundingBombs)
      })
  }

  function firstClick($field) {
    plantBombs($field.index())
    generateNumbers()
    $reset.removeClass('disabled')
    zegar.start()
    kolorTla(100, 0)
  }

  function leftClick(event) {
    var $this = $(this)

    if ($bomby === null) firstClick($this)

    //Jeśli kliknięto na odkryte pole...
    if ($this.hasClass('odkryte') && event.shiftKey) {
      //Wtedy odkryj wszystkie nieodkryte jeszcze pola naokoło klikniętego
      around($this.index())
        .not('.zaznaczone')
        .each((_, element) => odkryjPole(element))

      $pola.removeClass('hover')
    }

    if (isFlag($this)) return removeFlag($this)

    if (isBomb($this)) return lose()

    odkryjPole($this)
    //Sprawdź czy znaleziono wszystkie bomby
    checkGame()
  }

  function rightClick(field) {
    // TODO: fix this (I wanna be able to mark on first click)
    if ($bomby !== null) {
      const $field = $(field)

      if ($field.hasClass('odkryte')) return

      if ($field.hasClass('zaznaczone')) {
        removeFlag($field)
      } else if (liczbaBomb - liczbaOznaczonychBomb > 0) {
        putFlag($field)
      }

      //Zaktualizuj licznik
      liczbaOznaczonychBomb = $pola.filter('.zaznaczone').length
      $liczbaBomb.text(liczbaBomb - liczbaOznaczonychBomb)
      //Zmiana koloru tła - im więcej bomb znaleziono tym kolor bardziej zielony
      kolorTla(100, liczbaOznaczonychBomb * skokBomb)
      //Sprawdź czy znaleziono wszystkie bomby
      checkGame()
    }
  }

  function plantBombs(wykluczonePole) {
    var tablicaIndeksow = [] // Tablica zawięrająca indeksy pól, które zostano przerobione na bomby
    // Sprawdź czy ilość bomb do wypełnienia tablicy jest mniejsza niż ilość dostępnych pól
    if (liczbaBomb < numberOfFields) {
      // Dopóki ilość indeksów jest mniejsza niż zadeklarowana ilość bomb, którymi ma zostać wypełniona tabela...
      while (tablicaIndeksow.length < liczbaBomb) {
        var losowaLiczba = generateRandom(0, numberOfFields - 1, wykluczonePole), // Liczba od 0 do liczbaBomb - 1
          znaleziono = false // Domyślna wartość dla zmiennej pilnującej, czy liczby się nie powtarzają

        // Przeszukaj wszystkie dotychczas zebrane numery
        for (var i = 0; i < tablicaIndeksow.length; i++) {
          // Jeśli wsród nich jest indeks pierwszego klikniętego pola, lub jakiś indeks się powtarza, wylosuj inną liczbę
          if (tablicaIndeksow[i] === losowaLiczba) {
            znaleziono = true
            break
          }
        }

        // Jeśli numer się nie powtarza...
        if (!znaleziono) {
          // Zapisz go w tablicy
          tablicaIndeksow[tablicaIndeksow.length] = losowaLiczba
          // Utwórz bombę na polu o indeksie równym wylosowanej liczbie
          $pola.eq(losowaLiczba).data('rodzaj', 'bomba')
        }
      }

      // Zapisz bomby do zmiennej
      $bomby = $pola.filter(function () {
        return $(this).data('rodzaj') === 'bomba'
      })

      // DEVTOOLS
      // $bomby.addClass('has-bomb')
    } else {
      // Jeśli ilość bomb nie jest mniejsza niż ilość pól, wyświetl wiadomość
      console.error('Liczba bomb musi być mniejsza niż liczba pól')
    }
  }

  function isTouchDevice() {
    try {
      document.createEvent('TouchEvent')
      return true
    } catch (e) {
      return false
    }
  }

  function resize() {
    $grid.css('height', $grid.width())
  }

  if (isTouchDevice()) {
    $grid.on('contextmenu', '> div', () => false)
  } else {
    $grid.on('contextmenu', '> div', function () {
      rightClick(this)
      return false
    })
  }

  $grid.on('click', '> div', leftClick)

  $grid.on('touchstart', '> div', function () {
    touchTimeout = setTimeout(() => {
      rightClick(this)
    }, 300)
  })

  $grid.on('touchend', '> div', function () {
    clearTimeout(touchTimeout)
  })

  $grid.on('mouseleave', '> div', () => $pola.removeClass('hover'))

  $('.reset').on('click', function () {
    if ($(this).hasClass('disabled')) return

    zegar.zeruj()
    $pola.removeClass().addClass('zakryte').empty().data('rodzaj', '')
    $bomby = null
    $liczbaBomb.text(liczbaBomb)
    liczbaOznaczonychBomb = 0
    $grid.css('pointer-events', 'auto')
    kolorTla(0, 0)
    $(this).addClass('disabled')
  })

  $('.pomoc').on('click', function () {
    if ($aside.is(':visible')) {
      $aside.removeClass('active')

      $('.pomoc').find('.fa').removeClass('fa-times-circle').addClass('fa-question-circle')

      mobileTimer = setTimeout(function () {
        $aside.hide()
      }, 200)
    } else {
      clearTimeout(mobileTimer)
      $('.pomoc').find('.fa').removeClass('fa-question-circle').addClass('fa-times-circle')
      $aside.show().focus().addClass('active')
    }
  })

  $aside.on('click', function () {
    $aside.removeClass('active')
    $('.pomoc').find('.fa').removeClass('fa-times-circle').addClass('fa-question-circle')

    mobileTimer = setTimeout(function () {
      $aside.hide()
    }, 300)
  })

  resize()

  $(window).on('resize', resize)

  $(document).on('keydown', event => event.shiftKey && around($('#grid > .odkryte:hover').index()).addClass('hover'))

  $(document).on('keyup', () => $pola.removeClass('hover'))

  $('main').removeClass('hidden')
})
