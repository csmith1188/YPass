export function createWebController(container) {
  return {
    home(req, res) {
      res.render('pages/home', {
        title: 'Home',
        features: container.config.features,
      });
    },
    example(req, res) {
      res.render('pages/example', {
        title: 'Example',
        socketEnabled: container.config.features.socketIo,
      });
    },
    teacher(req, res) {
      res.render('pages/teacher', {
        title: 'Teacher',
        currentUser: req.session.user || res.locals.currentUser || null,
      });
    },
    kiosk(req, res) {
      res.render('pages/kiosk', {
        title: 'Kiosk',
        currentUser: req.session.user || res.locals.currentUser || null,
      });
    }   
  };
}
