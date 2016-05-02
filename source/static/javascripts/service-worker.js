self.addEventListener('push', function(event) {
    event.waitUntil(
        self.registration.showNotification('Poker App Staging', {
            body: 'Someone poked you.'
        })
    );
});
