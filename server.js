const express = require("express");
const Sequelize = require("sequelize");
const { DataTypes } = require("sequelize");
const USERS = require("./users.json");
const app = express();
app.use(express.json());
const connection = new Sequelize("test", "root", "#@!admin123456", {
  host: "localhost",
  dialect: "mysql",
});

const User = connection.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      // defaultValue: DataTypes.INTEGER, // here `defaultValue` is called attribute qualifier
    },
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        isAlphanumeric: true,
      },
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
    hooks: {
      beforeValidate: (user) => {
        console.log("Before Validate !");
      },
      afterValidate: (user) => {
        console.log("After Validate !");
      },
      beforeCreate: (user) => {
        console.log("Before Create !");
        user.full_name = `${user.first_name} ${user.last_name}`;
      },
      afterCreate: (user) => {
        console.log("After Create! ");
      },
    },
  }
);

const Post = connection.define(
  "Post",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
    },
    content: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: false,
  }
);

const Comments = connection.define(
  "Comment",
  {
    comment: {
      type: DataTypes.STRING,
    },
  },
  { timestamps: false }
);

const Project = connection.define(
  "Project",
  {
    title: { type: DataTypes.STRING },
  },
  { timestamps: false }
);

Post.belongsTo(User, { as: "userRef", foreignKey: "userId" }); // put a `userId` as a foreign key in Post table
Post.hasMany(Comments, { as: "All_Comments", foreignKey: "postId" });

// Example of Many to Many Associations
// Creates a UserProjects table with IDs for ProjectId and UserId
User.belongsToMany(Project, { as: "Tasks", through: "UserProjects" });
Project.belongsToMany(User, { as: "Workers", through: "UserProjects" });

connection
  .sync({ force: true })
  .then(() => {
    User.bulkCreate(USERS)
      .then(() => {
        console.log("Users Created");
      })
      .catch((error) => {
        console.log(error);
      });
    Post.create({
      userId: 1,
      title: "Hello world!",
      content: "Lorem Ipsum Dolor ........",
    })
      .then(() => {
        console.log("Post Created !");
      })
      .catch((error) => {
        console.log(error);
      });
    Comments.create({ comment: "Nice", postId: 1 })
      .then(() => {
        console.log("Comment Created !");
      })
      .catch((error) => {
        console.log(error);
      });
    Project.create({ title: "Project 1" })
      .then((project) => {
        project.setWorkers([1, 2, 3]);
        console.log("Project Created !");
      })
      .catch((error) => {});
  })
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Unable to connect database", err);
  });

app.listen(4001, () => {
  console.log("Server is running on port 4001");
});

app.get("/allposts", (req, res) => {
  Post.findAll({
    include: [
      {
        model: User,
        as: "userRef",
      },
    ],
  })
    .then((post) => {
      res.status(200).send(post);
    })
    .catch((error) => {
      console.log(error);
      res.status(404).send(err);
    });
});

app.get("/allcomments", (req, res) => {
  Post.findByPk(1, {
    include: [
      {
        model: Comments,
        as: "All_Comments",
        attributes: ["comment"],
      },
      { model: User, as: "userRef", attributes: ["name", "email"] },
    ],
  })
    .then((post) => {
      res.status(200).send(post);
    })
    .catch((error) => {
      console.log(error);
      res.status(404).send(err);
    });
});
/*
One-To-One
----------------
User.hasOne(Post)
or
Post.BelongsTo(User)


One-To-Many
-------------------
hasMany()
User.hasMany(Post)
Array Of items retrived 


Many-To-Many
----------------
belongsToMany()
(Join table)
Array Of items retrived 

User.BelongsToMany(Post)
Post.BelongsToMany(User)



*/
