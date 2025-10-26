const express = require("express");
const faucetRoute = require("./faucet.route");

const router = express.Router();

const defaultRoutes = [
  {
    path: "/faucet",
    route: faucetRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
