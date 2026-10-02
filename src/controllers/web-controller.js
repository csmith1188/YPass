export function createWebController(container) {
  const { passService } = container;

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
    async kiosk(req, res, next) {
      try {
        const kioskCode = String(req.query.kiosk || 'main-office');
        const options = await passService.kioskOptions(kioskCode);
        renderKiosk(res, {
          kioskCode,
          ...options,
          action: null,
          student: null,
          form: {},
          message: null,
        });
      } catch (error) {
        next(error);
      }
    },
    async scanKiosk(req, res, next) {
      const kioskCode = req.body.kioskCode;
      try {
        const result = await passService.scanStudent({
          kioskCode,
          studentNumber: req.body.studentNumber,
          actorUserId: req.currentUser?.id,
        });
        const message = scanMessage(result);
        renderKiosk(res, { ...result, kioskCode, form: {}, message });
      } catch (error) {
        if (!error.expose) {
          next(error);
          return;
        }
        try {
          const options = await passService.kioskOptions(kioskCode);
          renderKiosk(res, {
            ...options,
            kioskCode,
            form: req.body,
            message: { type: 'error', text: error.message },
          }, error.status);
        } catch (renderError) {
          next(renderError);
        }
      }
    },
    async createKioskPass(req, res, next) {
      const kioskCode = req.body.kioskCode;
      try {
        const result = await passService.requestPass({
          kioskCode,
          studentNumber: req.body.studentNumber,
          studentName: req.body.studentName,
          destinationLocationId: req.body.destinationLocationId,
          actorUserId: req.currentUser?.id,
        });
        renderKiosk(res, {
          ...result,
          kioskCode,
          form: {},
          message: {
            type: 'success',
            text: `Pass requested for ${result.student.display_name}. A teacher must approve it before departure.`,
          },
        });
      } catch (error) {
        if (!error.expose) {
          next(error);
          return;
        }
        try {
          const options = await passService.kioskOptions(kioskCode);
          renderKiosk(res, {
            ...options,
            kioskCode,
            student: { display_name: req.body.studentName },
            form: req.body,
            message: { type: 'error', text: error.message },
          }, error.status);
        } catch (renderError) {
          next(renderError);
        }
      }
    },
    manager(req, res) {
      res.render('pages/manager', {
        title: 'Manager',
        currentUser: req.session.user || res.locals.currentUser || null,
      });
    } 
  };

  function renderKiosk(res, data, status = 200) {
    res.status(status).render('pages/kiosk', {
      title: 'Student Pass Kiosk',
      currentUser: res.req.currentUser || null,
      action: null,
      student: null,
      destinations: [],
      kiosk: null,
      form: {},
      message: null,
      ...data,
    });
  }
}

function scanMessage(result) {
  if (result.action === 'create') {
    return { type: 'info', text: `Welcome, ${result.student.display_name}. Choose a destination.` };
  }
  if (result.action === 'pending') {
    return { type: 'warning', text: 'This student has a pass waiting for teacher approval.' };
  }
  if (result.action === 'arrival') {
    return { type: 'success', text: `Arrival recorded for ${result.student.display_name}.` };
  }
  if (result.action === 'scan_out') {
    return { type: 'info', text: `${result.student.display_name} has left the destination.` };
  }
  return { type: 'success', text: `Pass ended for ${result.student.display_name}.` };
}
