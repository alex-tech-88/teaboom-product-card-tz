/* ---------- Фасовка и цена ---------- */

const form = document.querySelector('[data-product-form]');

if (form) {
  const skuElement = form.querySelector('[data-sku]');
  // data-price и data-old-price есть и у radio-кнопок, поэтому ищем только внутри блока цены
  const priceElement = form.querySelector('.price [data-price]');
  const oldPriceElement = form.querySelector('.price [data-old-price]');
  const priceMeta = form.querySelector('[data-price-meta]');

  // 326.4 → «326,40 ₽», 1432 → «1 432 ₽»
  const formatPrice = (value) => {
    const fractionDigits = Number.isInteger(value) ? 0 : 2;

    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  };

  const updateProduct = (input) => {
    const price = Number(input.dataset.price);
    const oldPrice = Number(input.dataset.oldPrice);

    skuElement.textContent = input.value;
    priceElement.textContent = formatPrice(price);
    // Цена для поисковиков (schema.org) — в отдельном <meta>
    priceMeta.content = input.dataset.price;

    if (oldPrice > price) {
      oldPriceElement.textContent = formatPrice(oldPrice);
      oldPriceElement.hidden = false;
    } else {
      oldPriceElement.hidden = true;
    }
  };

  form.addEventListener('change', (evt) => {
    if (evt.target.name === 'pack') {
      updateProduct(evt.target);
    }
  });

  // Браузер может восстановить выбранную фасовку после перезагрузки страницы
  const checkedInput = form.querySelector('input[name="pack"]:checked');

  if (checkedInput) {
    updateProduct(checkedInput);
  }

  // Корзины нет по ТЗ — не даём форме перезагружать страницу
  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
  });
}

/* ---------- Галерея ---------- */

const gallery = document.querySelector('[data-gallery]');
const lightbox = document.querySelector('[data-lightbox]');

if (gallery && lightbox) {
  const mainImage = gallery.querySelector('[data-gallery-main]');
  const mainSource = gallery.querySelector('[data-gallery-main-source]');
  const openButton = gallery.querySelector('[data-gallery-open]');
  const thumbs = [...gallery.querySelectorAll('[data-gallery-thumb]')];

  const lightboxImage = lightbox.querySelector('[data-lightbox-image]');
  const lightboxSource = lightbox.querySelector('[data-lightbox-source]');
  const counter = lightbox.querySelector('[data-lightbox-counter]');
  const prevButton = lightbox.querySelector('[data-lightbox-prev]');
  const nextButton = lightbox.querySelector('[data-lightbox-next]');
  const closeButton = lightbox.querySelector('[data-lightbox-close]');

  // У каждого фото есть варианты img/фото-400.jpg, img/фото-400.webp и т. д.
  const PHOTO_WIDTHS = [400, 640, 970];
  const buildSrcset = (base, extension) => PHOTO_WIDTHS
    .map((width) => `${base}-${width}.${extension} ${width}w`)
    .join(', ');

  const photos = thumbs.map((thumb) => ({
    base: thumb.dataset.photo,
    alt: thumb.dataset.alt,
  }));
  const hasManyPhotos = photos.length > 1;
  let currentIndex = 0;

  // Миниатюры видны всегда, как на сайте; стрелки и счётчик — только если фото больше одного
  prevButton.hidden = !hasManyPhotos;
  nextButton.hidden = !hasManyPhotos;
  counter.hidden = !hasManyPhotos;

  const showPhoto = (index) => {
    // По кругу: с последнего фото — на первое и наоборот
    currentIndex = (index + photos.length) % photos.length;
    const { base, alt } = photos[currentIndex];

    // Браузер берёт фото из srcset, а не из src, поэтому меняем оба
    mainSource.srcset = buildSrcset(base, 'webp');
    mainImage.srcset = buildSrcset(base, 'jpg');
    mainImage.src = `${base}-640.jpg`;
    mainImage.alt = alt;

    // На весь экран — сразу самый крупный вариант
    lightboxSource.srcset = `${base}-970.webp`;
    lightboxImage.src = `${base}-970.jpg`;
    lightboxImage.alt = alt;
    counter.textContent = `${currentIndex + 1} / ${photos.length}`;

    thumbs.forEach((thumb, i) => {
      if (i === currentIndex) {
        thumb.setAttribute('aria-current', 'true');
      } else {
        thumb.removeAttribute('aria-current');
      }
    });
  };

  const openLightbox = () => {
    showPhoto(currentIndex);
    lightbox.showModal();
    document.documentElement.classList.add('is-scroll-locked');
  };

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => showPhoto(i));
  });

  openButton.addEventListener('click', openLightbox);
  mainImage.addEventListener('click', openLightbox);

  prevButton.addEventListener('click', () => showPhoto(currentIndex - 1));
  nextButton.addEventListener('click', () => showPhoto(currentIndex + 1));
  closeButton.addEventListener('click', () => lightbox.close());

  // Клик по тёмному фону вокруг фото закрывает галерею
  lightbox.addEventListener('click', (evt) => {
    if (evt.target === lightbox) {
      lightbox.close();
    }
  });

  // Esc закрывает <dialog> сам, стрелки добавляем вручную
  lightbox.addEventListener('keydown', (evt) => {
    if (!hasManyPhotos) {
      return;
    }

    if (evt.key === 'ArrowLeft') {
      showPhoto(currentIndex - 1);
    } else if (evt.key === 'ArrowRight') {
      showPhoto(currentIndex + 1);
    }
  });

  // Свайп на телефоне
  let touchStartX = 0;

  lightbox.addEventListener('touchstart', (evt) => {
    touchStartX = evt.changedTouches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (evt) => {
    const deltaX = evt.changedTouches[0].clientX - touchStartX;

    if (hasManyPhotos && Math.abs(deltaX) > 50) {
      showPhoto(deltaX > 0 ? currentIndex - 1 : currentIndex + 1);
    }
  });

  lightbox.addEventListener('close', () => {
    document.documentElement.classList.remove('is-scroll-locked');
  });

  showPhoto(0);
}

/* ---------- Вкладки ---------- */

const tabsRoot = document.querySelector('[data-tabs]');

if (tabsRoot) {
  const tabs = [...tabsRoot.querySelectorAll('[role="tab"]')];

  const selectTab = (tab, { focus = false } = {}) => {
    tabs.forEach((item) => {
      const isSelected = item === tab;
      const panel = document.getElementById(item.getAttribute('aria-controls'));

      item.setAttribute('aria-selected', String(isSelected));
      // Стрелками переходят между вкладками, Tab — сразу в содержимое
      item.tabIndex = isSelected ? 0 : -1;
      panel.hidden = !isSelected;
    });

    if (focus) {
      tab.focus();
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => selectTab(tab));
  });

  // Клавиатура по паттерну WAI-ARIA Tabs: ←/→ — соседняя вкладка, Home/End — первая/последняя
  tabsRoot.addEventListener('keydown', (evt) => {
    const index = tabs.indexOf(document.activeElement);

    if (index === -1) {
      return;
    }

    const keyToIndex = {
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };

    if (evt.key in keyToIndex) {
      evt.preventDefault();
      selectTab(tabs[keyToIndex[evt.key]], { focus: true });
    }
  });

  // «оставить отзыв» открывает вкладку «Отзывы» и прокручивает к ней
  const reviewLink = document.querySelector('[data-review-link]');
  const reviewsTab = tabs.find((tab) => tab.getAttribute('aria-controls') === 'reviews');

  if (reviewLink && reviewsTab) {
    reviewLink.addEventListener('click', (evt) => {
      evt.preventDefault();
      selectTab(reviewsTab);
      tabsRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('reviews').focus({ preventScroll: true });
    });
  }
}

/* ---------- Избранное ---------- */

const likeButton = document.querySelector('[data-like]');

if (likeButton) {
  const storageKey = `like:${likeButton.dataset.like}`;

  const setLiked = (isLiked) => {
    likeButton.setAttribute('aria-pressed', String(isLiked));
  };

  // localStorage может быть недоступен (приватный режим, запрет cookies)
  try {
    setLiked(localStorage.getItem(storageKey) === '1');
  } catch {
    // Тогда просто не запоминаем лайк
  }

  likeButton.addEventListener('click', () => {
    const isLiked = likeButton.getAttribute('aria-pressed') !== 'true';

    setLiked(isLiked);

    try {
      if (isLiked) {
        localStorage.setItem(storageKey, '1');
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // Лайк работает до перезагрузки страницы
    }
  });
}
