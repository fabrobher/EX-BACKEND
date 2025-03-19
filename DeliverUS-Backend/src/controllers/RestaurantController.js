import { Product, ProductCategory, Restaurant, RestaurantCategory, sequelizeSession } from '../models/models.js'

const index = async function (req, res) {
  try {
    const restaurants = await Restaurant.findAll(
      {
        attributes: { exclude: ['userId'] },
        include:
      {
        model: RestaurantCategory,
        as: 'restaurantCategory'
      },
        order: [['pinned', 'DESC'], [{ model: RestaurantCategory, as: 'restaurantCategory' }, 'name', 'ASC']]
      }
    )
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

const indexOwner = async function (req, res) {
  try {
    const restaurants = await Restaurant.findAll(
      {
        attributes: { exclude: ['userId'] },
        where: { userId: req.user.id },
        include: [{
          model: RestaurantCategory,
          as: 'restaurantCategory'
        }],
        order: ['pinned', 'DESC']
      })
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

const create = async function (req, res) {
  const newRestaurant = Restaurant.build(req.body)
  newRestaurant.userId = req.user.id // usuario actualmente autenticado
  try {
    const restaurant = await newRestaurant.save()
    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const show = async function (req, res) {
  // Only returns PUBLIC information of restaurants
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId, {
      attributes: { exclude: ['userId'] },
      include: [{
        model: Product,
        as: 'products',
        include: { model: ProductCategory, as: 'productCategory' }
      },
      {
        model: RestaurantCategory,
        as: 'restaurantCategory'
      }],
      order: [[{ model: Product, as: 'products' }, 'order', 'ASC']]
    }
    )
    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const update = async function (req, res) {
  try {
    await Restaurant.update(req.body, { where: { id: req.params.restaurantId } })
    const updatedRestaurant = await Restaurant.findByPk(req.params.restaurantId)
    res.json(updatedRestaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const destroy = async function (req, res) {
  try {
    const result = await Restaurant.destroy({ where: { id: req.params.restaurantId } })
    let message = ''
    if (result === 1) {
      message = 'Sucessfuly deleted restaurant id.' + req.params.restaurantId
    } else {
      message = 'Could not delete restaurant.'
    }
    res.json(message)
  } catch (err) {
    res.status(500).send(err)
  }
}

const promote = async function (req, res) {
  const t = await sequelizeSession.transaction() // Asegúrate de crear la transacción correctamente
  try {
    // Buscar el restaurante que ya está promocionado por el usuario
    const restaurantPromoted = await Restaurant.findOne({
      where: { userId: req.user.id, promoted: true }
    })

    // Si existe un restaurante promocionado previamente, desmarcarlo
    if (restaurantPromoted) {
      restaurantPromoted.promoted = false
      await restaurantPromoted.save({ transaction: t }) // Guardar con la transacción
    }

    // Buscar el restaurante que el usuario quiere promocionar
    const updatedRestaurant = await Restaurant.findByPk(req.params.restaurantId)

    if (!updatedRestaurant) {
      // Si no se encuentra el restaurante, devolver un error 404
      return res.status(404).send('Restaurante no encontrado')
    }

    // Verificar si el restaurante pertenece al usuario
    if (updatedRestaurant.userId !== req.user.id) {
      return res.status(403).send('No tienes permiso para promocionar este restaurante')
    }

    // Marcar el nuevo restaurante como promocionado
    updatedRestaurant.promoted = true

    // Guardar los cambios del restaurante promocionado
    await updatedRestaurant.save({ transaction: t }) // Guardar con la transacción

    // Confirmar la transacción
    await t.commit()

    // Responder con el restaurante actualizado
    res.json(updatedRestaurant)
  } catch (err) {
    // Si algo falla, revertir la transacción
    await t.rollback()
    res.status(500).send(err)
  }
}

const RestaurantController = {
  index,
  indexOwner,
  create,
  show,
  update,
  destroy,
  promote
}
export default RestaurantController
