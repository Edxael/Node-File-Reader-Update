// ===[ Deps ]========
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
const fs = require('fs')
const parser = require('xml2json')
const db = require('./ExpServFiles/knex')
const router = express.Router()
const axios = require('axios')
const uuidv4 = require('uuid/v4')



// ===[ MIDDLEWARE ]=================================
app.use(express.static(path.join(__dirname, 'build')))
app.use(require('./ExpServFiles/headers'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())



// ===[ Routes ]================================= 
        // ---[ Test Routes ]---
// app.get('/ping', (req, res) => {
//     return res.send('PONG')
// })
// app.get('/', (req, res) => {
//     res.send("Home-1")
// })
//         // ---[ API ]---
// app.use('/api', router)      // all of our routes will be prefixed with /api




// ===[ FILE-MANIPULATIO ]============================
let myCount = 1
let sourceFolder = './01-FTP/'


const theFun1 = () => {

    fs.readdir(sourceFolder, (err, files) => {

        if(err){ 
            console.log("Error 1: ", err) 
        }else if(files.length > 0){
            console.log(` ============================== \n Check: ${myCount} - For Files.`)
            console.log(files)
            console.log("Next file to Process: ", files[files.length -1])

                // Reading data on XML File
            fs.readFile( `./01-FTP/${files[files.length -1]}`, function(err, data) {
                let jsonData = parser.toJson(data);  // <-- This load jsonData variable with JSON..
                let jsOBJ = JSON.parse(jsonData)     // <-- This change from JSON -to-> JavaScript.  
                let newRecords = jsOBJ.OTA_HotelStayInfoNotifRQ.StayInfos.StayInfo

                if(Array.isArray(newRecords)){ // When XML has more thatn one record. ===> Note: this do not chekc for ZERO-Record make sure to add that feature latter.
                    console.log("\nThis file has: ", newRecords.length, " Records.")
                    newRecords.map((x)=>{

                        if(!x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email){ // Here when the customer do not provide Emaiil the object Email is not existen, so this will create it and load '$t' with undefined
                            x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email = { $t: undefined }
                        }
                        if(x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t == '@'){ // Here when the Email is ==- '@' change it to undefine
                            x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t = undefined
                        }

                            // Loading the selected data to variables
                            let propertyCode = jsOBJ.OTA_HotelStayInfoNotifRQ.StayInfos.HotelName
                            let sourceOfBussines = x.HotelReservation.RoomStays.RoomStay.SourceOfBusiness
                            let tranDollarAmount = x.RevenueCategories.RevenueCategory[0].SummaryAmount.Amount   // <-- Im asuming that the revenue category #9 is always on the index "0" of the array. // also later make it int
                            let guestEmail = x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t
                            let tranPoints = Math.round(tranDollarAmount) // The Points calculation need to be tabulated.
        
                            
        
                            if(guestEmail === undefined){
                                console.log("No Email... No Points --> :-(\n \n")
                            }else{

                                    // console.log("Requesting The ID when the Email: ", guestEmail)
                                db.from('users').where({ email: guestEmail }).select().then((data) => {
                                    console.log(" \n\nThe ID received: ", data[0].id)

                                    let tranInfo = {
                                        id: uuidv4(),
                                        OwnerUserId: data[0].id,
                                        PropertyCode: propertyCode,
                                        SourceOfBusiness: sourceOfBussines,
                                        DollarAmount: Math.round(tranDollarAmount),
                                        EndDate: x.HotelReservation.RoomStays.RoomStay.TimeSpan.End,
                                        GuestFirstName: x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.PersonName.GivenName,
                                        GuestLastName: x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.PersonName.Surname,
                                        Email: guestEmail,
                                        Points: tranPoints,
                                        HotelReservationId: x.HotelReservation.UniqueID.ID,
                                        ProcessDate: jsOBJ.OTA_HotelStayInfoNotifRQ.TransactionIdentifier
                                    }
                
                                    console.log( ' ===> About to create record.')
                                    console.log("----------------------------------")
                                    console.log(tranInfo)
                                    console.log("----------------------------------")

                                        // Inserting record to database:
                                    db.insert(tranInfo).into('CrystalPointsTransactions').then((data) => {
                                        console.log("Response from DB when creating new record: ", data.command, "...\n")
                                    }).catch( (error) => { console.log(error) })


                                }).catch( (error) => { console.log(error) })
                                // }).catch( (error) => { console.log(error) })

                            }
                    })

 
                        // Moving the file after Database Insertion.
                            // Copy last file on array to 02-Storage Directory
                    fs.copyFile(`./01-FTP/${files[files.length -1]}`, `./02-Storage/${files[files.length -1]}`, (err) => {
                        if (err) throw err;
                        console.log('\n File was copied to Storage Directory.');

                            // Deleting last file on the Array
                        fs.unlink(`./01-FTP/${files[files.length -1]}`, (err) => {
                            if (err) throw err;
                            console.log(' File was deleted \n ==============================\n');
                        })
                    }) 
                                  


                } else {   //===[ When XML has ONLY-ONE Record. ]=================================
                    console.log("This file has only one Record to create. ")
                    // *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
                    if(!newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email){ // Here when the customer do not provide Emaiil the object Email is not existen, so this will create it and load '$t' with undefined
                        newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email = { $t: undefined }
                    }
                    if(newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t == '@'){ // Here when the Email is ==- '@' change it to undefine
                        newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t = undefined
                    }

                    let propertyCode = jsOBJ.OTA_HotelStayInfoNotifRQ.StayInfos.HotelName
                    let sourceOfBussines = newRecords.HotelReservation.RoomStays.RoomStay.SourceOfBusiness
                    let tranDollarAmount = newRecords.RevenueCategories.RevenueCategory[0].SummaryAmount.Amount   // <-- Im asuming that the revenue category #9 is always on the index "0" of the array. // also later make it int
                    let guestEmail = newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t
                    let tranPoints = Math.round(tranDollarAmount) // The Points calculation need to be tabulated.

                    

                    if(guestEmail === undefined){
                        console.log("No Email... No Points..............................")
                    }else{
                            // console.log("Requesting The ID when the Email: ", guestEmail)
                        
                        db.from('users').where({ email: guestEmail }).select().then((data) => {
                            console.log(" \n\nThe ID received: ", data[0].id)
                            let tranInfo = {
                                id: uuidv4(),
                                OwnerUserId: data[0].id,
                                PropertyCode: propertyCode,
                                SourceOfBusiness: sourceOfBussines,
                                DollarAmount: Math.round(tranDollarAmount),
                                EndDate: newRecords.HotelReservation.RoomStays.RoomStay.TimeSpan.End,
                                GuestFirstName: newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.PersonName.GivenName,
                                GuestLastName: newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.PersonName.Surname,
                                Email: guestEmail,
                                Points: tranPoints,
                                HotelReservationId: newRecords.HotelReservation.UniqueID.ID,
                                ProcessDate: jsOBJ.OTA_HotelStayInfoNotifRQ.TransactionIdentifier
                            }
        
                            console.log( ' ===> About to create record:')
                            console.log("----------------------------------")
                            console.log(tranInfo)
                            console.log("----------------------------------")

                                // Inserting record to database:
                            db.insert(tranInfo).into('CrystalPointsTransactions').then((data) => {
                                console.log("Response from DB when creating new record: ", data.command)

                                    // Copy last file on array to 02-Storage Directory
                                fs.copyFile(`./01-FTP/${files[files.length -1]}`, `./02-Storage/${files[files.length -1]}`, (err) => {
                                    if (err) throw err;
                                    console.log('\n File was copied to Storage Directory.');

                                        // Deleting last file on the Array
                                    fs.unlink(`./01-FTP/${files[files.length -1]}`, (err) => {
                                        if (err) throw err;
                                        console.log(' File was deleted \n ==============================\n');
                                    })
                                })

                            }).catch( (error) => { console.log(error) }) 

                        }).catch( (error) => { console.log(error) })  

                    }
                }     
            })

        }else{
            console.log(`Check: ${myCount} - No File to Process`)
        }
    
      })

    myCount = myCount + 1
}




    // Interval in how often the script search review if there are New XML files
setInterval(() => { theFun1() }, 2000)




// ===[ Server ]============================
// app.listen((process.env.PORT || 3000), (err) => {
    app.listen((process.env.PORT || 5000), (err) => {
        if(err){ throw err }
    console.log("Server LOP: 5000 .....\n")
})

