import { Product, ProductCategory, Restaurant, RestaurantCategory } from '../models/models.js'

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
        order: [['pinned', 'DESC'], ['pinnedAt', 'ASC'], [{ model: RestaurantCategory, as: 'restaurantCategory' }, 'name', 'ASC']]
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
        order: [['pinned', 'DESC'], ['pinnedAt', 'ASC']]
      })
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

const create = async function (req, res) {
  const newRestaurant = Restaurant.build(req.body)
  newRestaurant.pinnedAt = newRestaurant.pinned ? new Date() : null
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

const togglePinned = async function (req, res) {
  try {
    const newRestaurant = await Restaurant.findByPk(req.params.restaurantId)

    if (!newRestaurant) {
      return res.status(404).json({ error: 'Restaurant not found' })
    }

    if (newRestaurant) {
      newRestaurant.pinned = !newRestaurant.pinned
      newRestaurant.pinnedAt = newRestaurant.pinned ? new Date() : null
    }

    await newRestaurant.save()

    res.json(newRestaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const togglePinned2 = async function (req, res) {
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId)

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' })
    }

    // Alternar el estado de "pinned" y actualizar "pinnedAt"
    await Restaurant.update(
      {
        pinned: !restaurant.pinned,
        pinnedAt: !restaurant.pinned ? new Date() : null
      },
      { where: { id: req.params.restaurantId } }
    )

    const updatedRestaurant = await Restaurant.findByPk(req.params.restaurantId)
    res.status(200).json(updatedRestaurant)
  } catch (err) {
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
  togglePinned,
  togglePinned2
}
export default RestaurantController
