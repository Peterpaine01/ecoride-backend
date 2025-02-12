const nodemailer = require("nodemailer");

const sendNotificationRideEmail = async (
  passengerData,
  rideId,
  bookingStatus,
  bookingId
) => {
  try {
    console.log("passengerData ->", passengerData);

    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // false for TLS
      auth: {
        user: "burley.bode10@ethereal.email", // user Ethereal
        pass: "uKPZ5DjVXVgUXAAeEb", // pass Ethereal
      },
    });

    // Ride booked
    const mailOptionsBookedRide = {
      from: '"Ecoride" <hello@ecoride.com>',
      to: passengerData.email,
      subject: "Votre trajet est bien réservé !",
      html: `
        <p>Bonjour ${passengerData.username},</p>
        <p>Votre réservation a bein été effectué.</p>
        <p>retrouver toutes les informations sur votre trajet :</p>
        <a href="${process.env.FRONT_URL}/vos-trajets">Voir mon trajet</a>
        <p>Merci d'utiliser Ecoride !</p>
      `,
    };

    // Ride started / ongoing
    const mailOptionsStartedRide = {
      from: '"Ecoride" <hello@ecoride.com>',
      to: passengerData.email,
      subject: "Votre trajet a commencé !",
      html: `
        <p>Bonjour ${passengerData.username},</p>
        <p>Votre trajet a commencé. Nous espérons que vous avez bien pris place à bord.</p>
        <p>Bon voyage avec Ecoride !</p>
      `,
    };

    const validateUrl = `${process.env.FRONT_URL}/valider-mon-trajet/${bookingId}`;

    // Ride completed
    const mailOptionsCompletedRide = {
      from: '"Ecoride" <hello@ecoride.com>',
      to: passengerData.email,
      subject: "Validez votre trajet",
      html: `
        <p>Bonjour ${passengerData.username},</p>
        <p>Votre trajet est maintenant terminé. Nous espérons qu'il s'est déroulé sans encombres.</p>
        <p>Merci de valider votre trajet et de laisser une note au conducteur en cliquant sur le lien ci-dessous :</p>
        <a href="${validateUrl}">Valider mon trajet</a>
        <p>Merci d'utiliser Ecoride !</p>
      `,
    };

    // Ride canceled
    const mailOptionsCanceledRide = {
      from: '"Ecoride" <hello@ecoride.com>',
      to: passengerData.email,
      subject: "Votre trajet est annulé",
      html: `
        <p>Bonjour ${passengerData.username},</p>
        <p>Votre trajet a été annulé par le conducteur. </p>
        <p>Retrouver tous les trajets disponibles sur Ecoride :</p>
        <a href="${process.env.FRONT_URL}">Trouver un autre trajet</a>
        <p>Merci d'utiliser Ecoride !</p>
      `,
    };

    if (bookingStatus === "forthcoming") {
      await transporter.sendMail(mailOptionsBookedRide);
      console.log(`Confirm Ride Email send to ${passengerData.email}`);
    }
    if (bookingStatus === "ongoing") {
      await transporter.sendMail(mailOptionsStartedRide);
      console.log(`Started Ride Email send to ${passengerData.email}`);
    }
    if (bookingStatus === "completed") {
      await transporter.sendMail(mailOptionsCompletedRide);
      console.log(`Validation Ride Email send to ${passengerData.email}`);
    }
    if (bookingStatus === "canceled") {
      await transporter.sendMail(mailOptionsCanceledRide);
      console.log(`Validation Ride Email send to ${passengerData.email}`);
    }
  } catch (error) {
    console.error("Error while sending email:" + error);
  }
};

module.exports = sendNotificationRideEmail;
