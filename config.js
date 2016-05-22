module.exports = {
    'secret': 'a677338a7b0e1e214c76f846daa4bab2875250ff',
    'database': 'mongodb://localhost:27017/qx',
    'sessionTimelife': 30 * 60 * 1000,
    messages: {
        auth: {
            authenticationFailed: 'Con los datos proporcionados no ha sido posible identificarte, por favor verifica e intenta de nuevo.',
            authenticationIncomplete: 'Disculpenos, no ha sido posible finalizar el proceso de identificación, por favor intente nuevamente en unos momentos.',
            nonExistentToken: 'El token proporcionado no existe, por favor verifique e intente nuevamente.',
            expiredToken: 'La sessión ha expirado, por favor ingrese nuevamente a la aplicación.',
        }
    }
}