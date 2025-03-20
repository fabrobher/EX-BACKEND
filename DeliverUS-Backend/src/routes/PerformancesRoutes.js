// This is a new file for solution!
import PerformanceController from '../controllers/PerformanceController.js'
import * as PerformanceValidation from '../controllers/validation/PerformanceValidation.js'
import { hasRole, isLoggedIn } from '../middlewares/AuthMiddleware.js'
import * as PerformanceMiddleware from '../middlewares/PerformanceMiddleware.js'
import { handleValidation } from '../middlewares/ValidationHandlingMiddleware.js'

const loadFileRoutes = (app) => {
  // TO-DO
  // Introduce the needed routing
  app.route('/performances')
    .post(
      isLoggedIn,
      hasRole('owner'),
      PerformanceValidation.create,
      handleValidation,
      PerformanceMiddleware.checkPerformanceRestaurantOwnership,
      PerformanceController.create
    )
}

export default loadFileRoutes
