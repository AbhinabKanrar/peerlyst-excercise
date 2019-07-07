if (Meteor.isServer) {
    const uuid = require('uuid/v4')

    Meteor.startup(function () {
        Auth = new Meteor.Collection('auth')
        User = new Meteor.Collection('user')
        Follow = new Meteor.Collection('follow')
        Post = new Meteor.Collection('post')
    })

    Router.route('/login', { where: 'server' })
        .post(function () {
            let response
            if (!this.request.body.id || !this.request.body.password) {
                response = {
                    "status": false,
                    "error": "Invalid data"
                }
            } else {
                let data = User.find({ _id: this.request.body.id, password: this.request.body.password }).fetch()

                if (data) {
                    token = uuid()
                    Auth.upsert({ userId: data[0]._id }, { $set: { token: token } })

                    response = {
                        "status": true,
                        "token": token
                    }
                } else {
                    response = {
                        "status": false
                    }
                }
            }
            this.response.setHeader('Content-Type', 'application/json')
            this.response.end(JSON.stringify(response))
        })

    Router.route('/users', { where: 'server' })
        .get(function () {
            let data = User.find().fetch()

            let response = {
                "status": true,
                "data": data
            }

            this.response.setHeader('Content-Type', 'application/json')
            this.response.end(JSON.stringify(response))
        })
        .post(function () {
            let response
            if (!this.request.body.username || !this.request.body.password) {
                response = {
                    "status": false,
                    "error": "Invalid data"
                }
            } else {
                User.insert({
                    username: this.request.body.username,
                    password: this.request.body.password,
                    ts: new Date()
                })
                response = {
                    "status": true
                }
            }
            this.response.setHeader('Content-Type', 'application/json')
            this.response.end(JSON.stringify(response))
        })

    Router.route('/follow', { where: 'server' })
        .get(function () {
            let data = Follow.find({ followerId: this.request.headers["p-userid"] }).fetch()

            let response = {
                "status": true,
                "data": data
            }

            this.response.setHeader('Content-Type', 'application/json')
            this.response.end(JSON.stringify(response))
        })
        .post(function () {
            let response
            if (!this.request.body.id && !this.request.body.tag) {
                response = {
                    "status": false,
                    "error": "Invalid data"
                }
            } else {
                Follow.insert({
                    followerId: this.request.headers["p-userid"],
                    userId: this.request.body.id,
                    tag: this.request.body.tag,
                    ts: new Date()
                })
                response = {
                    "status": true
                }
            }
            this.response.setHeader('Content-Type', 'application/json')
            this.response.end(JSON.stringify(response))
        })

    Router.route('/posts', { where: 'server' })
        .get(function () {
            let follows = Follow.find({ followerId: this.request.headers["p-userid"] }).fetch()

            let followingUserIds = follows.filter(follow => follow['userId']).map(follow => follow['userId'])
            let followingTags = follows.filter(follow => follow['tag']).map(follow => follow['tag'])

            let page = this.params.query.page
            let size = this.params.query.size

            if(page) {
                page = parseInt(page, 10)
            } else {
                page = 0
            }

            if(size) {
                size = parseInt(size, 10)
            } else {
                size = 0
            }

            let data = Post.find({$or: [{'userId': {"$in": followingUserIds}}, {'tags': {"$in": followingTags}}]}, {skip: page, limit: size}, {sort: {'ts': -1}}).fetch()

            let response = {
                "status": true,
                "data": data
            }

            this.response.setHeader('Content-Type', 'application/json')
            this.response.end(JSON.stringify(response))
        })
        .post(function () {
            let response
            if (!this.request.body.type || !this.request.body.msg) {
                response = {
                    "status": false,
                    "error": "Invalid data"
                }
            } else {
                Post.insert({
                    type: this.request.body.type,
                    msg: this.request.body.msg,
                    userId: this.request.headers["p-userid"],
                    tags: this.request.body.tags,
                    ts: new Date()
                })
                response = {
                    "status": true
                }
            }

            this.response.setHeader('Content-Type', 'application/json')
            this.response.end(JSON.stringify(response))
        })
}