var express    = require('express');
var oracledb    = require('oracledb');
var app        = express(); 
var cors = require('cors')
require('dotenv').config();
var port = process.env.APP_PORT || 3001;

app.use(cors());
app.listen(port);
console.log('Iniciado servicio en el puerto: ' + port);

//configuracion datos DB
//la configuracion puede estar en el archivo .env
dbConfig = {
	user          : process.env.NODE_ORACLEDB_USER || "okcasa",
	password      : process.env.NODE_ORACLEDB_PASSWORD ,
	connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING || "localhost:1521/xe",
	externalAuth  : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};
console.log("Config DB:")	
console.log(dbConfig)
async function init() 
{
	//Configuracion para todas las rutas de localhost
	app.all('/*', function(req, res, next) 
	{
		//Headers no seguros, solo de prueba, permite CSRF
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		next();
	});

	//Obtiene todos los servicios y retorna un json
	app.get("/solicitudes", async (req, res, next) => 
	{
		console.log("Consultando todos los servicios");
		console.log('Conectandose con la base de datos...');
	  	try 
		{
		//conectarse
		const conexion = await oracledb.getConnection(dbConfig);
		console.log( conexion != null ? "Conexión Exitosa" : "Error en la conexión");
		//consulta
		const result =  await conexion.execute
		(
			// query
			`
			select solicitud.IDSOLICITUD,solicitud.valorinsp, solicitud.descuento,solicitud.idcliente, solicitud.fechasolicitud
			FROM solicitud
			JOIN solicitudtraza traza on (traza.idsolicitud = solicitud.idsolicitud)
			WHERE (SELECT count(idtraza) from solicitudtraza where solicitud.idsolicitud = solicitudtraza.idsolicitud) = 1
			AND traza.idestado = 1
			`,// poner como variable, mayor seguridad, https://github.com/oracle/node-oracledb/issues/946
			{
				//opcional
				// maxRows: 1
			}
		//MAGIA DE EXPRESS - USA PROMESAS - RETORNA EL JSON.
		).then(rows => 
			{	console.log("Entregando solicitudes pendientes");
				res.json(rows);
			})
	  		.catch(err => {
				return
	  		});;
		conexion.close()
		//Informacion de la consulta
		}catch (err) {console.error(err);
  		}finally 
  		{
			
	  		
		}		
	});
}
	//obtiene 1 servicio recibiendo la id
	/*
	app.get("/servicios/:idservicio", (req, res, next) => {
		const conexion = await oracledb.getConnection(dbConfig);
		console.log("Consultando el servicio con id="+req.params.idProducto);
		conexion.query("SELECT * FROM servicio where id= ?", [req.params.idProducto])
		.then(rows => {	
			res.json(rows);
			})
	  .catch(err => {
		return
	  });
	});*/
		
init();