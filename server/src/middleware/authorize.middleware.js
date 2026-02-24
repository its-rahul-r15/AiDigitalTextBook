export function authorize(...allowedRoles) {
  return (req, res, next) => {

 
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    const role = req.user.role;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "Forbidden: you don't have access"
      });
    }

    next();
  };
}
