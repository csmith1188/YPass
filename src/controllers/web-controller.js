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
  };
}
