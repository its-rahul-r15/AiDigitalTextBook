import multer from "multer"
import path from "path";

const storage = multer.diskStorage({
  destination: function (
    req: Express.Request,
    file: Express.Multer.File,
    cb
  ) {
    cb(null, "./public/temp");
  },
  filename: function (
    req: Express.Request,
    file: Express.Multer.File,
    cb
  ) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });