/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { createCardElement, deleteCard, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { 
  getUserInfo, 
  getCardList, 
  setUserInfo, 
  updateUserAvatar,
  addNewCard,
  deleteCardFromServer,
  changeLikeCardStatus
} from "./components/api.js";

// дд.мм.гггг
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Месяцы с 0
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

// Создание объекта с настройками валидации
const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};


// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");
let currentUserId = "";
const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalTitle = usersStatsModalWindow.querySelector(".popup__title");
const usersStatsModalInfoList = usersStatsModalWindow.querySelector(".popup__info");
const usersStatsModalUserList = usersStatsModalWindow.querySelector(".popup__list");
const logo = document.querySelector(".header__logo"); // Логотип в header

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

// Функция создания строки статистики
const createInfoString = (term, description) => {
  const template = document.getElementById("popup-info-definition-template");
  const infoItem = template.content.cloneNode(true);
  
  infoItem.querySelector(".popup__info-term").textContent = term;
  infoItem.querySelector(".popup__info-description").textContent = description;
  
  return infoItem;
};

// Функция создания элемента пользователя
const createUserListItem = (user) => {
  const template = document.getElementById("popup-info-user-preview-template");
  const listItem = template.content.cloneNode(true);
  
  const userBadge = listItem.querySelector(".popup__list-item_type_badge");
  userBadge.textContent = user.name;
  
  return listItem;
};

const handleLikeClick = (cardId, likeButton, likeCountElement) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
     
      likeButton.classList.toggle("card__like-button_is-active");
      
      
      likeCountElement.textContent = updatedCard.likes.length;
    })
    .catch((err) => {
      console.error("Ошибка при изменении лайка:", err);
    });
};

const handleLogoClick = () => {

  usersStatsModalInfoList.innerHTML = '';
  usersStatsModalUserList.innerHTML = '';
  

  Promise.all([getCardList(), getUserInfo()])
    .then(([cards, userData]) => {
  
      usersStatsModalTitle.textContent = `Статистика пользователя ${userData.name}`;
  
      usersStatsModalInfoList.append(
        createInfoString("Карточек создано:", cards.length.toString())
      );
   
      if (userData.createdAt) {
        usersStatsModalInfoList.append(
          createInfoString("Дата регистрации:", formatDate(userData.createdAt))
        );
      }
      
      if (cards.length > 0) {
      
        const sortedCards = [...cards].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        usersStatsModalInfoList.append(
          createInfoString("Первая создана:", formatDate(sortedCards[0].createdAt))
        );
        
        usersStatsModalInfoList.append(
          createInfoString("Последняя создана:", formatDate(sortedCards[sortedCards.length - 1].createdAt))
        );
      }
      const uniqueUsers = new Map();
      cards.forEach(card => {
        if (card.likes) {
          card.likes.forEach(user => {
            if (!uniqueUsers.has(user._id)) {
              uniqueUsers.set(user._id, user);
            }
          });
        }
      });
      
      uniqueUsers.set(userData._id, userData);
      const usersTitle = usersStatsModalWindow.querySelector(".popup__text");
      usersTitle.textContent = `Пользователей: ${uniqueUsers.size}`;
    
      uniqueUsers.forEach(user => {
        usersStatsModalUserList.append(createUserListItem(user));
      });
      openModalWindow(usersStatsModalWindow);
    })
    .catch((err) => {
      console.log("Ошибка при загрузке статистики:", err);
    });
}; 

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = profileForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  
  submitButton.textContent = "Сохранение...";
  
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
  .then((userData) => {
    // Обновляем данные на странице из ответа сервера
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;

    closeModalWindow(profileFormModalWindow);
  })
  .catch((err) => {
    console.log(err);
  })
  .finally(() => {
    submitButton.textContent = originalText;
  });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = avatarForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  
  submitButton.textContent = "Сохранение...";

  updateUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  
  // Получаем кнопку отправки
  const submitButton = cardForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  
  submitButton.textContent = "Создание...";

  addNewCard(cardNameInput.value, cardLinkInput.value)
    .then((newCard) => {
      placesWrap.prepend(
        createCardElement(
          newCard,
          currentUserId,  
          {
            onPreviewPicture: handlePreviewPicture,
            onLikeIcon: handleLikeClick,
            onDeleteCard: handleDeleteCard,
          }
        )
      );
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleDeleteCard = (cardId, cardElement) => {
  deleteCardFromServer(cardId)
    .then(() => {
      cardElement.remove();
    })
    .catch((err) => {
      console.error("Ошибка при удалении карточки:", err);
    });
    
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  openModalWindow(cardFormModalWindow);
});

logo.addEventListener("click", handleLogoClick);

//Настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// Включаем валидацию всех форм
enableValidation(validationSettings);

// Загрузка данных с сервера при запуске приложения
Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
     currentUserId = userData._id; 
     window.currentUserId = userData._id;

    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;

    if (userData.avatar) {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    }

    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(cardData, currentUserId, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteCard,
        })
      );
    });
  })
  .catch((err) => {
    console.log(err); 
  });
