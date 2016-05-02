self.addEventListener('push', function(event) {
    event.waitUntil(
        self.registration.showNotification('Poker App Staging', {
            body: 'Someone poked you.'
        })
    );
});


self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    event.waitUntil(
        self.clients.openWindow('/')
    );
});
