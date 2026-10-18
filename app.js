'use strict';

const DRIVER_STORAGE_KEY = 'transnet-kisangani.drivers.v1';
const MARKET_STORAGE_KEY = 'transnet-kisangani.markets.v1';
const USD_TO_CDF = 2350;

const exampleDrivers = [
  {
    id: 'example-free-1',
    fullName: 'Chauffeur exemple A',
    vehicleMake: 'Toyota',
    vehicleModel: 'Berline — profil exemple',
    vehicleYear: '2020',
    vehiclePlate: 'EXEMPLE',
    availability: 'free',
    isExample: true
  },
  {
    id: 'example-free-2',
    fullName: 'Chauffeur exemple B',
    vehicleMake: 'Nissan',
    vehicleModel: 'SUV — profil exemple',
    vehicleYear: '2019',
    vehiclePlate: 'EXEMPLE',
    availability: 'free',
    isExample: true
  },
  {
    id: 'example-busy-1',
    fullName: 'Chauffeur exemple C',
    vehicleMake: 'Hyundai',
    vehicleModel: 'Berline — profil exemple',
    vehicleYear: '2021',
    vehiclePlate: 'EXEMPLE',
    availability: 'busy',
    isExample: true
  }
];

function showMessage(element, text) {
  if (!element) return;
  element.textContent = text;
  element.classList.remove('hidden');
}

function readStoredList(key, label) {
  const raw = localStorage.getItem(key);
  if (raw === null) return [];
  const value = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error(`Le registre ${label} est invalide.`);
  return value;
}

function writeMarketRequests(requests) {
  localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(requests));
}

function readMarketRequests() {
  const requests = readStoredList(MARKET_STORAGE_KEY, 'des demandes');
  return requests.map((request, index) => {
    if (!request || typeof request.id !== 'string' || typeof request.driverId !== 'string' ||
        typeof request.driverName !== 'string' || typeof request.pickup !== 'string' ||
        typeof request.destination !== 'string' ||
        !['pending', 'accepted', 'finalized', 'completed'].includes(request.status)) {
      throw new Error(`La demande numéro ${index + 1} est invalide.`);
    }
    return request;
  });
}

function getAllDrivers() {
  const registeredDrivers = readRegisteredDrivers();
  const examples = exampleDrivers.map((example) =>
    registeredDrivers.find((driver) => driver.id === example.id) || example
  );
  return [...examples, ...registeredDrivers.filter((driver) => !exampleDrivers.some((example) => example.id === driver.id))];
}

function setDriverAvailability(driverId, availability) {
  const registeredDrivers = readRegisteredDrivers();
  let driver = registeredDrivers.find((item) => item.id === driverId);
  if (!driver) driver = exampleDrivers.find((item) => item.id === driverId);
  if (!driver) throw new Error('Ce chauffeur ne figure pas dans l’annuaire.');

  const updatedDriver = { ...driver, availability, isExample: false };
  const existingIndex = registeredDrivers.findIndex((item) => item.id === driverId);
  if (existingIndex >= 0) registeredDrivers[existingIndex] = updatedDriver;
  else registeredDrivers.push(updatedDriver);
  localStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(registeredDrivers));
}

document.querySelectorAll('[data-current-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const menu = document.getElementById(button.getAttribute('aria-controls'));
    if (!menu) return;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('hidden', expanded);
  });
});

document.querySelectorAll('#mobile-menu a').forEach((link) => {
  link.addEventListener('click', () => {
    const menu = document.getElementById('mobile-menu');
    const button = document.querySelector('[data-menu-toggle]');
    if (menu) menu.classList.add('hidden');
    if (button) button.setAttribute('aria-expanded', 'false');
  });
});

const driverForm = document.getElementById('driver-form');
if (driverForm) {
  driverForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = document.getElementById('driver-form-message');
    const formData = new FormData(driverForm);
    const fullName = [formData.get('firstName'), formData.get('postName'), formData.get('lastName')]
      .map((value) => String(value).trim())
      .filter(Boolean)
      .join(' ');
    const driver = {
      id: `driver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fullName,
      vehicleMake: String(formData.get('vehicleMake')).trim(),
      vehicleModel: String(formData.get('vehicleModel')).trim(),
      vehicleYear: String(formData.get('vehicleYear')).trim(),
      vehiclePlate: String(formData.get('vehiclePlate')).trim().toUpperCase(),
      availability: String(formData.get('availability'))
    };

    try {
      const registeredDrivers = readRegisteredDrivers();
      if (registeredDrivers.some((item) => item.vehiclePlate && item.vehiclePlate.toUpperCase() === driver.vehiclePlate)) {
        showMessage(message, 'Cette plaque figure déjà dans le registre de démonstration de ce navigateur.');
        return;
      }
      localStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify([...registeredDrivers, driver]));
      driverForm.reset();
      showMessage(message, 'Fiche de démonstration ajoutée à cet appareil. Elle apparaît dans l’annuaire ; aucun numéro de carte d’électeur ni autre coordonnée personnelle n’a été enregistré. Cette fiche n’est pas transmise à la régie.');
      renderDriverDirectory();
    } catch (error) {
      showMessage(message, `Impossible d’enregistrer la fiche dans ce navigateur : ${error.message}`);
    }
  });
}

function readRegisteredDrivers() {
  const raw = localStorage.getItem(DRIVER_STORAGE_KEY);
  if (raw === null) return [];

  const drivers = JSON.parse(raw);
  if (!Array.isArray(drivers)) {
    throw new Error('Le registre local des chauffeurs est invalide.');
  }

  return drivers.map((driver, index) => {
    const requiredText = ['id', 'fullName', 'vehicleMake', 'vehicleModel', 'vehicleYear', 'vehiclePlate'];
    if (!driver || requiredText.some((key) => typeof driver[key] !== 'string') ||
        !['free', 'busy'].includes(driver.availability)) {
      throw new Error(`La fiche de chauffeur numéro ${index + 1} est invalide.`);
    }
    return { ...driver, isExample: false };
  });
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createDriverCard(driver, isAvailable, hasActiveRequest = false) {
  const card = document.createElement('article');
  card.className = 'rounded-2xl border border-ink/5 bg-white p-5 shadow-sm';
  const topRow = document.createElement('div');
  topRow.className = 'flex items-start justify-between gap-3';
  const identity = document.createElement('div');
  identity.append(
    createTextElement('h4', 'font-extrabold', driver.fullName),
    createTextElement('p', 'mt-1 text-xs text-ink/50', driver.isExample ? 'Profil de démonstration' : 'Chauffeur partenaire')
  );
  const status = createTextElement(
    'span',
    isAvailable
      ? 'shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800'
      : 'shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900',
    hasActiveRequest ? 'Demande en cours' : isAvailable ? 'Libre' : 'Occupé'
  );
  topRow.append(identity, status);

  const vehicle = createTextElement('p', 'mt-4 text-sm font-semibold', `${driver.vehicleMake} ${driver.vehicleModel}`);
  const year = createTextElement('p', 'mt-1 text-xs text-ink/55', `Année : ${driver.vehicleYear}`);
  const plate = createTextElement('p', 'mt-1 text-xs text-ink/55', `Plaque : ${driver.vehiclePlate}`);
  card.append(topRow, vehicle, year, plate);

  if (isAvailable) {
    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.dataset.driverId = driver.id;
    selectButton.className = 'mt-5 w-full rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink';
    selectButton.textContent = 'Choisir ce chauffeur';
    selectButton.addEventListener('click', () => {
      document.getElementById('selected-driver-id').value = driver.id;
      document.getElementById('selected-driver-name').textContent =
        `${driver.fullName} · ${driver.vehicleMake} ${driver.vehicleModel} · ${driver.vehiclePlate}`;
      document.getElementById('clear-driver').classList.remove('hidden');
      document.querySelectorAll('[data-driver-id]').forEach((button) => {
        const selected = button.dataset.driverId === driver.id;
        button.setAttribute('aria-pressed', String(selected));
        button.textContent = selected ? 'Chauffeur choisi' : 'Choisir ce chauffeur';
        button.classList.toggle('ring-2', selected);
        button.classList.toggle('ring-lime', selected);
      });
      document.getElementById('booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    card.append(selectButton);
  } else {
    const unavailable = createTextElement(
      'p',
      'mt-5 rounded-xl bg-mist px-3 py-2.5 text-center text-xs font-semibold text-ink/50',
      hasActiveRequest ? 'Demande déjà en cours' : 'Indisponible pour le moment'
    );
    card.append(unavailable);
  }
  return card;
}

function renderDriverDirectory() {
  const freeContainer = document.getElementById('free-drivers');
  const busyContainer = document.getElementById('busy-drivers');
  if (!freeContainer || !busyContainer) return;

  const message = document.getElementById('directory-message');
  try {
    const drivers = getAllDrivers();
    const activeDriverIds = new Set(
      readMarketRequests()
        .filter((request) => request.status === 'pending' || request.status === 'accepted')
        .map((request) => request.driverId)
    );
    const freeDrivers = drivers.filter((driver) => driver.availability === 'free');
    const busyDrivers = drivers.filter((driver) => driver.availability === 'busy');
    freeContainer.replaceChildren(...freeDrivers.map((driver) => {
      const hasActiveRequest = activeDriverIds.has(driver.id);
      return createDriverCard(driver, !hasActiveRequest, hasActiveRequest);
    }));
    busyContainer.replaceChildren(...busyDrivers.map((driver) => createDriverCard(driver, false)));
    document.getElementById('free-count').textContent = String(freeDrivers.length);
    document.getElementById('busy-count').textContent = String(busyDrivers.length);
    document.getElementById('free-empty').classList.toggle('hidden', freeDrivers.length > 0);
    document.getElementById('busy-empty').classList.toggle('hidden', busyDrivers.length > 0);
  } catch (error) {
    freeContainer.replaceChildren();
    busyContainer.replaceChildren();
    showMessage(message, `Impossible de charger l’annuaire : ${error.message}`);
  }
}

function formatMarketStatus(status) {
  const labels = {
    pending: 'En attente de réponse du chauffeur',
    accepted: 'Acceptée — en attente de finalisation client',
    finalized: 'Marché finalisé — chauffeur occupé',
    completed: 'Course terminée — chauffeur libre'
  };
  return labels[status] || 'Statut inconnu';
}

function createMarketCard(request, audience) {
  const card = document.createElement('article');
  card.className = 'rounded-2xl border border-ink/5 bg-white p-5 shadow-sm';
  const heading = createTextElement('h3', 'font-extrabold', request.driverName);
  const route = createTextElement('p', 'mt-2 text-sm font-semibold', `${request.pickup} → ${request.destination}`);
  const details = createTextElement(
    'p',
    'mt-1 text-xs text-ink/55',
    `${request.rideType === 'scheduled' ? `Planifié${request.travelDate ? ` le ${request.travelDate}` : ''}${request.travelTime ? ` à ${request.travelTime}` : ''}` : 'Trajet immédiat'} · ${request.fareUsd} USD / ${Number(request.fareCdf).toLocaleString('fr-FR')} CDF`
  );
  const status = createTextElement('p', 'mt-3 rounded-xl bg-mist px-3 py-2 text-xs font-semibold text-ink/70', formatMarketStatus(request.status));
  card.append(heading, route, details, status);

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'mt-4 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white hover:bg-ink';

  if (audience === 'driver' && request.status === 'pending') {
    action.textContent = 'Accepter cette demande';
    action.addEventListener('click', () => {
      try {
        const requests = readMarketRequests();
        const current = requests.find((item) => item.id === request.id);
        if (!current || current.status !== 'pending') {
          renderMarketRequests();
          return;
        }
        if (requests.some((item) => item.driverId === current.driverId && item.id !== current.id &&
            (item.status === 'pending' || item.status === 'accepted'))) {
          throw new Error('Une autre demande est déjà en cours pour ce chauffeur.');
        }
        current.status = 'accepted';
        current.acceptedAt = new Date().toISOString();
        writeMarketRequests(requests);
        renderMarketRequests();
        renderDriverDirectory();
      } catch (error) {
        showMessage(document.getElementById('driver-requests-message'), `Impossible d’accepter la demande : ${error.message}`);
      }
    });
    card.append(action);
  } else if (audience === 'client' && request.status === 'accepted') {
    action.textContent = 'Finaliser le marché';
    action.addEventListener('click', () => {
      try {
        const requests = readMarketRequests();
        const current = requests.find((item) => item.id === request.id);
        if (!current || current.status !== 'accepted') {
          renderMarketRequests();
          return;
        }
        const driver = getAllDrivers().find((item) => item.id === current.driverId);
        if (!driver || driver.availability !== 'free') {
          throw new Error('Ce chauffeur n’est plus libre ; actualisez la liste ou choisissez un autre chauffeur.');
        }
        setDriverAvailability(current.driverId, 'busy');
        current.status = 'finalized';
        current.finalizedAt = new Date().toISOString();
        writeMarketRequests(requests);
        renderMarketRequests();
        renderDriverDirectory();
      } catch (error) {
        showMessage(document.getElementById('booking-message'), `Impossible de finaliser le marché : ${error.message}`);
      }
    });
    card.append(action);
  } else if (audience === 'driver' && request.status === 'finalized') {
    action.textContent = 'Course terminée — me déclarer libre';
    action.className = 'mt-4 rounded-xl border border-forest px-4 py-2.5 text-sm font-bold text-forest hover:bg-forest hover:text-white';
    action.addEventListener('click', () => {
      try {
        const requests = readMarketRequests();
        const current = requests.find((item) => item.id === request.id);
        if (!current || current.status !== 'finalized') return;
        setDriverAvailability(current.driverId, 'free');
        current.status = 'completed';
        current.completedAt = new Date().toISOString();
        writeMarketRequests(requests);
        renderMarketRequests();
        renderDriverDirectory();
      } catch (error) {
        showMessage(document.getElementById('driver-requests-message'), `Impossible de mettre à jour la disponibilité : ${error.message}`);
      }
    });
    card.append(action);
  }
  return card;
}

function renderMarketRequests() {
  const driverContainer = document.getElementById('driver-requests');
  const clientContainer = document.getElementById('client-requests');
  if (!driverContainer && !clientContainer) return;

  try {
    const requests = readMarketRequests();
    if (driverContainer) {
      const visibleRequests = requests.filter((request) => request.status !== 'completed');
      driverContainer.replaceChildren(...visibleRequests.map((request) => createMarketCard(request, 'driver')));
      document.getElementById('driver-requests-empty').classList.toggle('hidden', visibleRequests.length > 0);
    }
    if (clientContainer) {
      const section = document.getElementById('client-requests-section');
      section.classList.toggle('hidden', requests.length === 0);
      clientContainer.replaceChildren(...requests.map((request) => createMarketCard(request, 'client')));
    }
  } catch (error) {
    showMessage(document.getElementById('driver-requests-message'), `Impossible de charger les demandes : ${error.message}`);
    showMessage(document.getElementById('booking-message'), `Impossible de charger vos demandes : ${error.message}`);
  }
}

renderDriverDirectory();
renderMarketRequests();

const clearDriverButton = document.getElementById('clear-driver');
if (clearDriverButton) {
  clearDriverButton.addEventListener('click', () => {
    document.getElementById('selected-driver-id').value = '';
    document.getElementById('selected-driver-name').textContent = 'Aucun chauffeur sélectionné';
    clearDriverButton.classList.add('hidden');
    document.querySelectorAll('[data-driver-id]').forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.textContent = 'Choisir ce chauffeur';
      button.classList.remove('ring-2', 'ring-lime');
    });
  });
}

const bookingForm = document.getElementById('booking-form');
if (bookingForm) {
  const pickup = document.getElementById('pickup');
  const destination = document.getElementById('destination');
  const scheduleFields = document.getElementById('schedule-fields');

  function updateFare() {
    const pickupOption = pickup.options[pickup.selectedIndex];
    const destinationOption = destination.options[destination.selectedIndex];
    const passengers = Number(document.getElementById('passengers').value);
    const bags = Number(document.getElementById('bags').value);
    const airportTrip = pickup.value === 'Bangboka' || destination.value === 'Bangboka';
    const distanceComponent = Math.max(Number(pickupOption.dataset.fare || 0), Number(destinationOption.dataset.fare || 0));
    const baseFare = airportTrip ? 25 : 12;
    const fare = pickup.value === destination.value
      ? baseFare
      : baseFare + distanceComponent + Math.max(0, passengers - 1) * 3 + Math.max(0, bags - 2) * 2;
    document.getElementById('fare-route').textContent = `${pickup.value} → ${destination.value}`;
    document.getElementById('fare-usd').textContent = `$${fare}`;
    document.getElementById('fare-cdf').textContent = `≈ ${(fare * USD_TO_CDF).toLocaleString('fr-FR')} CDF`;
  }

  document.querySelectorAll('input[name="rideType"]').forEach((input) => {
    input.addEventListener('change', (event) => {
      const planned = event.target.value === 'scheduled';
      scheduleFields.classList.toggle('hidden', !planned);
      scheduleFields.querySelectorAll('input').forEach((field) => {
        field.required = planned;
      });
    });
  });
  [pickup, destination, document.getElementById('passengers'), document.getElementById('bags')]
    .forEach((field) => field.addEventListener('change', updateFare));

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const selectedId = document.getElementById('selected-driver-id').value;
    if (!selectedId) {
      showMessage(
        document.getElementById('booking-message'),
        'Choisissez d’abord un chauffeur libre dans la liste avant de demander ce trajet.'
      );
      return;
    }
    try {
      const driver = getAllDrivers().find((item) => item.id === selectedId);
      if (!driver || driver.availability !== 'free') {
        throw new Error('Ce chauffeur n’est plus libre. Choisissez un chauffeur disponible dans la liste.');
      }
      const requests = readMarketRequests();
      if (requests.some((request) => request.driverId === selectedId &&
          (request.status === 'pending' || request.status === 'accepted'))) {
        throw new Error('Une demande est déjà en cours pour ce chauffeur.');
      }
      const formData = new FormData(bookingForm);
      requests.push({
        id: `market-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        driverId: driver.id,
        driverName: driver.fullName,
        pickup: String(formData.get('pickup')),
        destination: String(formData.get('destination')),
        rideType: String(formData.get('rideType')),
        travelDate: String(formData.get('travelDate') || ''),
        travelTime: String(formData.get('travelTime') || ''),
        fareUsd: Number(document.getElementById('fare-usd').textContent.replace(/[^\d.]/g, '')),
        fareCdf: Number(document.getElementById('fare-cdf').textContent.replace(/[^\d]/g, '')),
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      writeMarketRequests(requests);
      showMessage(
        document.getElementById('booking-message'),
        `Votre demande pour ${driver.fullName} est enregistrée dans ce navigateur. Le chauffeur doit l’accepter dans son espace avant que vous puissiez finaliser le marché.`
      );
      document.getElementById('selected-driver-id').value = '';
      document.getElementById('selected-driver-name').textContent = 'Aucun chauffeur sélectionné';
      document.getElementById('clear-driver').classList.add('hidden');
      renderDriverDirectory();
      renderMarketRequests();
      document.getElementById('client-requests-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      showMessage(document.getElementById('booking-message'), `La demande n’a pas été enregistrée : ${error.message}`);
    }
  });
  updateFare();
}

window.addEventListener('storage', (event) => {
  if (event.key === DRIVER_STORAGE_KEY) renderDriverDirectory();
  if (event.key === MARKET_STORAGE_KEY) {
    renderDriverDirectory();
    renderMarketRequests();
  }
});

const mapElement = document.getElementById('kisangani-map');
if (mapElement) {
  const gpsStartButton = document.getElementById('gps-start');
  const gpsStopButton = document.getElementById('gps-stop');
  const gpsStatus = document.getElementById('gps-status');
  const mapError = document.getElementById('map-error');
  let gpsWatchId = null;

  if (!window.L) {
    showMessage(mapError, 'La bibliothèque cartographique n’a pas pu être chargée. Vérifiez votre connexion internet puis rechargez la page.');
    gpsStartButton.disabled = true;
    gpsStartButton.classList.add('cursor-not-allowed', 'opacity-50');
  } else {
    const map = window.L.map(mapElement).setView([0.515, 25.25], 11);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    window.L.marker([0.515, 25.19]).addTo(map).bindPopup('Centre-ville de Kisangani');
    window.L.marker([0.49, 25.34]).addTo(map).bindPopup('Aéroport international de Bangboka');

    let positionMarker = null;
    let accuracyCircle = null;
    gpsStartButton.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showMessage(mapError, 'La géolocalisation n’est pas prise en charge par ce navigateur.');
        return;
      }
      if (gpsWatchId !== null) return;
      mapError.classList.add('hidden');
      gpsStatus.textContent = 'Demande d’autorisation GPS en cours…';
      gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const currentLocation = [latitude, longitude];
          if (!positionMarker) {
            positionMarker = window.L.marker(currentLocation).addTo(map).bindPopup('Position actuelle de cet appareil');
            accuracyCircle = window.L.circle(currentLocation, {
              radius: accuracy,
              color: '#0d6655',
              fillColor: '#0d6655',
              fillOpacity: 0.12
            }).addTo(map);
          } else {
            positionMarker.setLatLng(currentLocation);
            accuracyCircle.setLatLng(currentLocation).setRadius(accuracy);
          }
          map.setView(currentLocation, Math.max(map.getZoom(), 15));
          gpsStatus.textContent = `GPS actif — précision estimée ${Math.round(accuracy)} m. Dernière mise à jour : ${new Date(position.timestamp).toLocaleTimeString('fr-FR')}.`;
          gpsStartButton.classList.add('hidden');
          gpsStopButton.classList.remove('hidden');
        },
        (error) => {
          const descriptions = {
            1: 'Autorisation refusée : autorisez la position dans les réglages du navigateur.',
            2: 'Position introuvable. Réessayez lorsque le signal GPS sera disponible.',
            3: 'La demande GPS a expiré. Réessayez.'
          };
          gpsWatchId = null;
          gpsStartButton.classList.remove('hidden');
          gpsStopButton.classList.add('hidden');
          showMessage(mapError, descriptions[error.code] || `Erreur GPS : ${error.message}`);
          gpsStatus.textContent = 'Le suivi GPS est arrêté.';
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
      );
      gpsStartButton.classList.add('hidden');
      gpsStopButton.classList.remove('hidden');
    });
    gpsStopButton.addEventListener('click', () => {
      if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
      gpsStartButton.classList.remove('hidden');
      gpsStopButton.classList.add('hidden');
      gpsStatus.textContent = 'Le suivi GPS est arrêté. Votre position reste uniquement sur cette carte.';
    });
  }
}
