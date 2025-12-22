// Показать ошибку валидации
const showInputError = (formElement, inputElement, errorMessage, settings) => {
  const errorElement = formElement.querySelector(`#${inputElement.id}-error`);
  
  if (errorElement) {
    inputElement.classList.add(settings.inputErrorClass);
    errorElement.textContent = errorMessage;
    errorElement.classList.add(settings.errorClass);
  }
};

// Скрыть ошибку валидации
const hideInputError = (formElement, inputElement, settings) => {
  const errorElement = formElement.querySelector(`#${inputElement.id}-error`);
  
  if (errorElement) {
    inputElement.classList.remove(settings.inputErrorClass);
    errorElement.classList.remove(settings.errorClass);
    errorElement.textContent = '';
  }
};

// Проверить валидность поля
const checkInputValidity = (formElement, inputElement, settings) => {
  // Сбрасываем кастомные сообщения об ошибках
  inputElement.setCustomValidity('');
  
  // Проверяем поля с паттерном (имя и название места)
  if (inputElement.validity.patternMismatch) {
    const errorMessage = inputElement.dataset.errorMessage || 'Разрешены только буквы, пробелы и дефисы';
    inputElement.setCustomValidity(errorMessage);
  }
  
  if (!inputElement.validity.valid) {
    const errorMessage = inputElement.validationMessage;
    showInputError(formElement, inputElement, errorMessage, settings);
    return false;
  } else {
    hideInputError(formElement, inputElement, settings);
    return true;
  }
};

// Проверить, есть ли невалидные поля
const hasInvalidInput = (inputList) => {
  return inputList.some((inputElement) => {
    return !inputElement.validity.valid;
  });
};

// Отключить кнопку отправки
const disableSubmitButton = (buttonElement, settings) => {
  if (buttonElement) {
    buttonElement.classList.add(settings.inactiveButtonClass);
    buttonElement.disabled = true;
  }
};

// Включить кнопку отправки
const enableSubmitButton = (buttonElement, settings) => {
  if (buttonElement) {
    buttonElement.classList.remove(settings.inactiveButtonClass);
    buttonElement.disabled = false;
  }
};

// Переключить состояние кнопки
const toggleButtonState = (inputList, buttonElement, settings) => {
  if (hasInvalidInput(inputList)) {
    disableSubmitButton(buttonElement, settings);
  } else {
    enableSubmitButton(buttonElement, settings);
  }
};

// Установить обработчики событий
const setEventListeners = (formElement, settings) => {
  const inputList = Array.from(formElement.querySelectorAll(settings.inputSelector));
  const buttonElement = formElement.querySelector(settings.submitButtonSelector);
  
  // Блокируем кнопку при инициализации
  toggleButtonState(inputList, buttonElement, settings);
  
  // Добавляем обработчики на каждое поле
  inputList.forEach((inputElement) => {
    inputElement.addEventListener('input', () => {
      checkInputValidity(formElement, inputElement, settings);
      toggleButtonState(inputList, buttonElement, settings);
    });
  });
};

// Очистить валидацию формы
const clearValidation = (formElement, settings) => {
  const inputList = Array.from(formElement.querySelectorAll(settings.inputSelector));
  const buttonElement = formElement.querySelector(settings.submitButtonSelector);
  
  inputList.forEach((inputElement) => {
    inputElement.setCustomValidity('');
    hideInputError(formElement, inputElement, settings);
  });
  
  disableSubmitButton(buttonElement, settings);
};

// Включить валидацию для всех форм
const enableValidation = (settings) => {
  const formList = Array.from(document.querySelectorAll(settings.formSelector));
  
  formList.forEach((formElement) => {
    // Предотвращаем стандартную отправку формы
    formElement.addEventListener('submit', (evt) => {
      evt.preventDefault();
    });
    
    setEventListeners(formElement, settings);
  });
};

export { enableValidation, clearValidation };