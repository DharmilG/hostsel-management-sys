const {
  createAnnouncement,
  getAllAnnouncements
} = require("../models/Announcement")

const createAnnouncementHandler = async (req, res, next) => {
  try {
    const announcement = await createAnnouncement({
      ...req.body,
      created_by: req.user.id
    })
    res.status(201).json({ success: true, data: announcement })
  } catch (error) {
    next(error)
  }
}


const getAllAnnouncementsHandler = async (req, res, next) => {
  try {
    const announcements = await getAllAnnouncements()
    res.status(200).json({ success: true, data: announcements })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createAnnouncementHandler,
  getAllAnnouncementsHandler
}
