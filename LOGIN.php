<html>
<head>
<style>

body{
font-family: Arial;
background-color: antiquewhite;
height: 700px;
display: flex;
justify-content: center;
align-items: center;
margin: 0;
}

.LoginPage{
background: #fff;
padding: 30px;
border-radius: 10px;
box-shadow: 0 4px 8px #1d75a433;
width: 300px;
}

.LoginPage h1{
text-align: center; 
margin-bottom: 20px;
color: #333;
}

.LoginPage label{
font-weight: bold;
display: block;
margin-top: 20px;
color: #555;
}

.LoginPage input{
width: 100%;
padding: 10px;
margin-top: 5px;
border: 1px solid #ccc;
border-radius: 5px;
box-sizing: border-box;
}

#btn{
width: 100%;
padding: 10px;
background: #2980b9;
color: #fff;
border: none;
border-radius: 5px;
font-weight: bold;
margin-top: 15px;
}

#btn:hover{
background: #1f6391;
}

</style>

</head>
<body>
<form method="post" class="LoginPage">
<h1>LOGIN</h1></br>
<label>Username</label>
<input type="text" name="username" placeholder="Username"><br>
<label>Password</label>
<input type="password" name="password" placeholder="Password"><br>
<button type="submit" id="btn">Login</button>
</form>

<?php

if ($_SERVER["REQUEST_METHOD"] == "POST") {

$username = $_POST["username"]?? '';
$password = $_POST["password"]?? '';

if ($username == "AllanDave" && $password == "Admin"){
header("Location: http://localhost/SAMPLEPAGE/MYPORTFOLIO.php");
}
else{
echo '<script>alert("Invalid Username or Password")</script>';

}

}

?>

</body>
</html>
