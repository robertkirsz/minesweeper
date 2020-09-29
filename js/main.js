/* -------------------  /
/  Autor: Robert Kirsz  /
/ -------------------- */

$(function () {
  /**/
  'use strict'
  /**/

  var $tabela = $('#tabela'),
    $pola = $('#tabela td'),
    $iloscBomb = $('#iloscBomb'),
    iloscBomb = 15,
    iloscOznaczonychBomb = 0,
    skokBomb = 100 / iloscBomb,
    iloscPol = $pola.size(),
    $bomby = null,
    $minuty = $('#czas .minuty'),
    $sekundy = $('#czas .sekundy'),
    koniecGry = false,
    $body = $('body')

  $pola.addClass('zakryte')

  $iloscBomb.text(iloscBomb)

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

  function detonacja() {
    //Odkryj wszystkie bomby i pokoloruj je...
    if (!koniecGry) {
      $('.fa-flag').remove()
      $bomby.each(function () {
        if ($(this).hasClass('zaznaczone')) {
          //..na zielono, jeśli zostały zaznaczone
          $(this)
            .removeClass('zaznaczone')
            .addClass('dobrze')
            .prepend('<span class="fa fa-check"></span>')
        } else {
          //...na czerwono, jeśli nie zostały zaznaczone
          $(this).addClass('bomba').prepend('<span class="fa fa-bomb"></span>')
        }
      })
      //Nieprawidłowe zaznaczenia oznacz ikoną krzyżyka
      $pola.filter('.zaznaczone').prepend('<span class="fa fa-times"></span>')
      $tabela.css('pointer-events', 'none')
      zegar.stop()
      koniecGry = true
      kolorTla(0)
    }
  }

  function podlicz() {
    //Jeśli zaznaczono wszystkie bomby i żadne pola nie zostały zakryte...
    if (
      $bomby.filter('.zaznaczone').length == iloscBomb &&
      $pola.filter(':not([class]), [class=""]').length == 0
    ) {
      $tabela.css('pointer-events', 'none')
      zegar.stop()
      koniecGry = true
      $('.fa-flag').remove()
      $bomby.each(function () {
        if ($(this).hasClass('zaznaczone')) {
          //..na zielono, jeśli zostały zaznaczone
          $(this)
            .removeClass('zaznaczone')
            .addClass('dobrze')
            .prepend('<span class="fa fa-check"></span>')
        }
      })
    }
  }

  //Funkcja zmiany kolory tła
  function kolorTla(hue, saturation) {
    if (typeof saturation === 'undefined' || saturation === null) {
      saturation = 40
    }

    $body.css(
      'background-color',
      'hsla(' + hue + ', ' + saturation + '%, 70%, 0.5'
    )
  }

  function naokolo(element) {
    var $this = $(element),
      $index = $this.index(),
      $trWyzej = $this.parent().prev(),
      $trNizej = $this.parent().next()

    return $this
      .add($this.prev())
      .add($this.next())
      .add($trWyzej.find('td').eq($index))
      .add($trWyzej.find('td').eq($index).prev())
      .add($trWyzej.find('td').eq($index).next())
      .add($trNizej.find('td').eq($index))
      .add($trNizej.find('td').eq($index).prev())
      .add($trNizej.find('td').eq($index).next())
  }

  function iloscBombNaokolo(element) {
    if (element.data('rodzaj') === 'bomba') {
      detonacja()
    } else {
      element.addClass('odkryte')
      element.removeClass('zakryte')
      var $sasiedzi = naokolo(element).not('.odkryte'), //Zbierz pola graniczące z danym polem
        bombySasiadow = $sasiedzi.filter(function () {
          return $(this).data('rodzaj') === 'bomba'
        }).length //Policz ile z tych pól zawiera bombę

      //Jeśli nie ma bomb, to zamiast pisać 0 zostaw puste pole i zapisz element do tablicy, która później zostanie przetworzona ponownie
      if (bombySasiadow < 1) {
        bombySasiadow = ''
        naokolo(element)
          .not('.odkryte')
          .not('.zaznaczone')
          .each(function () {
            iloscBombNaokolo($(this))
          })
      }
      //Wyświetl łączną ilość bomb w graniczących z danym polem elementach
      element.text(bombySasiadow)
    }
  }

  function generateRandom(min, max, wykluczona) {
    var num = Math.floor(Math.random() * (max - min + 1)) + min
    return num === wykluczona ? generateRandom(min, max, wykluczona) : num
  }

  var shiftNaokolo = $()

  $(document).on('keydown', function (e) {
    if (e.shiftKey) {
      shiftNaokolo = naokolo($('.odkryte:hover'))
      shiftNaokolo.addClass('hover')
    }
  })

  $(document).on('keyup', function (e) {
    shiftNaokolo.removeClass('hover')
  })

  $tabela.on('mouseleave', '.odkryte', function () {
    shiftNaokolo.removeClass('hover')
  })

  //Kliknięcie lewym przyciskiem na pole
  $tabela.on('click', 'td', function (e) {
    //Jeśli to pierwsze kliknięcie na pole...
    if ($bomby === null) {
      utworzBomby($(this).parent().index() * 10 + $(this).index())
      $('.reset').removeClass('disabled')
      zegar.start()
      $('body').css(
        'background-color',
        'hsla(' + iloscOznaczonychBomb * skokBomb + ', 40%, 70%, 0.5'
      )
    }

    //Jeśli kliknięto na odkryte pole...
    if ($(this).hasClass('odkryte')) {
      //Nie rób nic, chyba że przytrzymano klawisz Shift
      if (e.shiftKey) {
        //Wtedy odkryj wszystkie nieodkryte jeszcze pola naokoło klikniętego
        naokolo($(this))
          .not('.odkryte')
          .not('.zaznaczone')
          .each(function () {
            iloscBombNaokolo($(this))
          })
        shiftNaokolo.removeClass('hover')
        //Sprawdź czy znaleziono wszystkie bomby
        podlicz()
      }
      //Jeśli kliknięto na zaznaczone pole...
    } else if ($(this).hasClass('zaznaczone')) {
      //Jeśli kliknięto na bombę...
    } else if ($(this).data('rodzaj') === 'bomba') {
      detonacja()
      //Jeśli kliknięto na zwykłe pole, wyświetl liczbę bomb z nim sąsiadujących
    } else {
      iloscBombNaokolo($(this))
      //Sprawdź czy znaleziono wszystkie bomby
      podlicz()
    }
  })

  function rightClick(to) {
    if ($bomby !== null) {
      var $this = $(to)
      //Jeśli pole nie zostało jeszcze odkryte...
      if (!$this.hasClass('odkryte')) {
        //Zaznacz/odznacz pole
        if ($this.hasClass('zaznaczone')) {
          $this.removeClass('zaznaczone').find('.fa-flag').css('opacity', 0)
          //Jeśli nie postawiono jeszcze ikony flagi i nie przekroczono limitu oznaczeń...
        } else if (iloscBomb - iloscOznaczonychBomb > 0) {
          if ($this.find('.fa-flag').length == 0) {
            $this.prepend('<span class="fa fa-flag"></span>')
          }

          $this
            .addClass('zaznaczone')
            .find('.fa-flag')
            .focus()
            .css('opacity', 1)
        }

        //Zaktualizuj licznik
        iloscOznaczonychBomb = $pola.filter('.zaznaczone').length
        $iloscBomb.text(iloscBomb - iloscOznaczonychBomb)
        //Zmiana koloru tła - im więcej bomb znaleziono tym kolor bardziej zielony
        kolorTla(iloscOznaczonychBomb * skokBomb)
        //Sprawdź czy znaleziono wszystkie bomby
        podlicz()
      }
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

  if (isTouchDevice()) {
    $tabela.on('contextmenu', 'td', () => false)
  } else {
    $tabela.on('contextmenu', 'td', function () {
      rightClick(this)
      return false
    })
  }

  var touchTimeout = null

  $tabela.on('touchstart', 'td', function () {
    touchTimeout = setTimeout(() => {
      rightClick(this)
    }, 300)
  })

  $tabela.on('touchend', 'td', function () {
    clearTimeout(touchTimeout)
  })

  //Zapełnianie tabeli bombami
  function utworzBomby(wykluczonePole) {
    var tablicaIndeksow = [] //Tablica zawięrająca indeksy pól, które zostano przerobione na bomby
    //Sprawdź czy ilość bomb do wypełnienia tablicy jest mniejsza niż ilość dostępnych pól
    if (iloscBomb < iloscPol) {
      //Dopóki ilość indeksów jest mniejsza niż zadeklarowana ilość bomb, którymi ma zostać wypełniona tabela...
      while (tablicaIndeksow.length < iloscBomb) {
        var losowaLiczba = generateRandom(0, iloscPol - 1, wykluczonePole), //Liczba od 0 do iloscBomb - 1
          znaleziono = false //Domyślna wartość dla zmiennej pilnującej, czy liczby się nie powtarzają
        //console.log(losowaLiczba);
        //Przeszukaj wszystkie dotychczas zebrane numery
        for (var i = 0; i < tablicaIndeksow.length; i++) {
          //Jeśli wsród nich jest indeks pierwszego klikniętego pola, lub jakiś indeks się powtarza, wylosuj inną liczbę
          if (tablicaIndeksow[i] === losowaLiczba) {
            znaleziono = true
            break
          }
        }

        //Jeśli numer się nie powtarza...
        if (!znaleziono) {
          //Zapisz go w tablicy
          tablicaIndeksow[tablicaIndeksow.length] = losowaLiczba
          //Utwórz bombę na polu o indeksie równym wylosowanej liczbie
          $pola.eq(losowaLiczba).data('rodzaj', 'bomba')
        }
      }

      //Zapisz bomby do zmiennej
      $bomby = $pola.filter(function () {
        return $(this).data('rodzaj') === 'bomba'
      })
      //$bomby.text('o');
      //Jeśli ilość bomb nie jest mniejsza niż ilość pól, wyświetl wiadomość
    } else {
      console.log('Ilość bomb musi być mniejsza niż ilość pól')
    }
  }

  $('.reset').on('click', function () {
    if (!$(this).hasClass('disabled')) {
      zegar.zeruj()
      $pola.removeClass().addClass('zakryte').empty().data('rodzaj', '')
      $bomby = null
      koniecGry = false
      $iloscBomb.text(iloscBomb)
      iloscOznaczonychBomb = 0
      $tabela.css('pointer-events', 'auto')
      kolorTla(0, 0)
      $(this).addClass('disabled')
    }
  })

  var $sterowanie = $('.sterowanie')

  var mobileTimer,
    $sterowanie = $('.sterowanie')

  $('.pomoc').on('click', function () {
    if ($sterowanie.is(':visible')) {
      $sterowanie.removeClass('active')
      $('.pomoc')
        .find('.fa')
        .removeClass('fa-times-circle obrot')
        .addClass('fa-question-circle')
      mobileTimer = setTimeout(function () {
        $sterowanie.hide()
      }, 200)
    } else {
      clearTimeout(mobileTimer)
      $('.pomoc')
        .find('.fa')
        .removeClass('fa-question-circle')
        .addClass('fa-times-circle obrot')
      $sterowanie.show().focus().addClass('active')
    }
  })

  $('.sterowanie').on('click', function () {
    $sterowanie.removeClass('active')
    $('.pomoc')
      .find('.fa')
      .removeClass('fa-times-circle obrot')
      .addClass('fa-question-circle')
    mobileTimer = setTimeout(function () {
      $sterowanie.hide()
    }, 300)
  })

  var $naglowek = $('.naglowek'),
    $content = $('#content')

  function resize() {
    //$tabela.css('width', $(window).height() - $naglowek.height());
    $content.css('width', $(window).height() - $naglowek.height())
    if ($(window).width() < 800) {
      $content.css('max-width', $(window).width())
    } else {
      $content.css('max-width', '800px')
    }
    $tabela.css('height', $tabela.width())
    $tabela.css('max-height', $tabela.width())
  }

  resize()

  $(window).on('resize', function () {
    resize()
  })

  //Wyświetl zawartość strony
  $('#content').css('opacity', 1)
})
