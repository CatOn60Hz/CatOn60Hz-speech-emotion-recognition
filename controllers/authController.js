const User = require("../models/User");

exports.login = async (req, res) => {
    const { username, password, role } = req.body;

    try {
        console.log('Login attempt:', { username, role }); // Log login attempt

        const user = await User.findOne({ username, role });
        console.log('Found user:', user ? 'Yes' : 'No'); // Log if user was found

        if (!user) {
            return res.status(401).json({ 
                status: "failure", 
                message: "User not found" 
            });
        }

        // Compare plain text passwords
        if (password !== user.password) {
            console.log('Password mismatch'); // Log password mismatch
            return res.status(401).json({ 
                status: "failure", 
                message: "Incorrect password" 
            });
        }

        console.log('Login successful'); // Log successful login
        res.status(200).json({ 
            status: "success", 
            role: user.role,
            message: "Login successful"
        });
    } catch (error) {
        console.error("Login error:", error); // Log detailed error
        res.status(500).json({ 
            status: "failure", 
            message: "Server error",
            error: error.message
        });
    }
};

exports.register = async (req, res) => {
    const { username, password, role } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username, role });
        if (existingUser) {
            return res.status(400).json({ 
                status: "failure", 
                message: "User already exists" 
            });
        }

        // Create new user with plain text password
        const user = new User({
            username,
            password,
            role
        });

        await user.save();

        res.status(201).json({ 
            status: "success", 
            message: "User registered successfully" 
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
            status: "failure", 
            message: "Server error",
            error: error.message
        });
    }
};