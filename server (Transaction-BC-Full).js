// ===[ Deps ]========
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
const fs = require('fs')
const parser = require('xml2json')
// var convert = require('xml-js')
const db = require('./ExpServFiles/knex')
const router = express.Router()
// const parseString = require('xml2js').parseString;
const axios = require('axios')
// import { v4 } from 'uuid'
// const uuid = require('uuid')





// ===[ MIDDLEWARE ]=================================
app.use(express.static(path.join(__dirname, 'build')))
app.use(require('./ExpServFiles/headers'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())






// ===[ Routes ]================================= 
        // ---[ Test Routes ]---
app.get('/ping', (req, res) => {
    return res.send('PONG')
})

app.get('/', (req, res) => {
    res.send("Home-1")
})


        // ---[ API ]---
app.use('/api', router)      // all of our routes will be prefixed with /api






// ===[ FILE-MANIPULATIO ]============================
let myCount = 1
let sourceFolder = './01-FTP/'
// console.log("Count: ", myCount, sourceFolder)


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
                let jsonData = parser.toJson(data);  // <-- This load jsonData variable with JSON
                let jsOBJ = JSON.parse(jsonData)     // <-- This change from JSON -to-> JavaScript.  
                let newRecords = jsOBJ.OTA_HotelStayInfoNotifRQ.StayInfos.StayInfo

                if(Array.isArray(newRecords)){ // Note: this do not chekc for ZERO-Record make sure to add that feature latter.
                    console.log("\nThis file has: ", newRecords.length, " Records.")
                    newRecords.map((x)=>{

                        if(!x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email){ // Here when the customer do not provide Emaiil the object Email is not existen, so this will create it and load '$t' with undefined
                            x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email = { $t: undefined }
                        }
                        if(x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t == '@'){ // Here when the Email is ==- '@' change it to undefine
                            x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t = undefined
                        }

                            // Loading the selected data to variables
                        // let cFullName = `${x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.PersonName.GivenName} ${x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.PersonName.Surname}`
                        // let cEmail = x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t
                        // let cCity = x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Address.CityName

                        // let tranId = v4()
                        let propertyCode = jsOBJ.OTA_HotelStayInfoNotifRQ.StayInfos.HotelName
                        let sourceOfBussines = x.HotelReservation.RoomStays.RoomStay.SourceOfBusiness
                        let dollarAmount = x.RevenueCategories.RevenueCategory[0].SummaryAmount.Amount   // <-- Im asuming that the revenue category #9 is always on the index "0" of the array. // also later make it int
                        let startDate = x.HotelReservation.RoomStays.RoomStay.TimeSpan.Start
                        let endDate = x.HotelReservation.RoomStays.RoomStay.TimeSpan.End
                        let guestFirstName = x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.PersonName.GivenName
                        let guestLastName = x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.PersonName.Surname
                        let phoneNumber = (x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Telephone) ? x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Telephone.PhoneNumber : "No Phone"
                        let guestEmail = x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t
                        let postalCode = x.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Address.PostalCode
                        let hotelReservationID = x.HotelReservation.UniqueID.ID
                        let processDate = jsOBJ.OTA_HotelStayInfoNotifRQ.TransactionIdentifier


                            // Preparin data for complete object to send to database..
                        // console.log("\n----------------------------------")
                        // // console.log(" TranID: ", tranId)
                        // console.log(" Property Code: ", propertyCode)
                        // console.log(" SourceOfBusiness: ", sourceOfBussines)
                        // console.log(" DollarAmount: ", dollarAmount)
                        // console.log(" StartDate (Arival): ", startDate)
                        // console.log(" EndDate (Departure): ", endDate)
                        // console.log(" GuestFirstName: ", guestFirstName)
                        // console.log(" GuestLastName: ", guestLastName)
                        // console.log(" PhoneNumber: ", phoneNumber)
                        // console.log(" Email: ", guestEmail)
                        // console.log(" PostalCode: ", postalCode)
                        // console.log(" HotelReservationID: ", hotelReservationID)
                        // console.log(" ProcessDate: ", processDate)
                        // console.log("----------------------------------")

                        let tranInfo = {
                            // id: uuid.v4(),
                            // id: uuid.v4(),/
                            OwnerUserId: '',
                            PropertyCode: propertyCode,
                            SourceOfBusiness: sourceOfBussines,
                            DollarAmount: '99',
                            EndDate: endDate,
                            GuestFirstName: guestFirstName,
                            GuestLastName: guestLastName,
                            PhoneNumber: '',
                            Email: guestEmail,
                            PostalCode: '',
                            Points: '19',
                            HotelReservationId: hotelReservationID,
                            ProcessDate: processDate
                        }

                        console.log("----------------------------------")
                        console.log(tranInfo)
                        console.log("----------------------------------")


                        if(guestEmail === undefined){
                            console.log("No Email... No Points...xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
                        }else{
                            console.log( '\n Creating new record on DataBase....')
                            // db.insert({ name: `${guestFirstName} ${guestLastName}`, country: sourceOfBussines, email: guestEmail }).into('users').then((data) => {
                            // db.insert({ id: myId, firstName: guestFirstName, lastName: guestLastName, password: myPass1, email: guestEmail, createdBy: creator1, updatedBy: updater1 }).into('users').then((data) => {
                            db.insert(tranInfo).into('users').then((data) => {
                            console.log("Response from DB when creating new record: ", data)

                            db.insert({ userId: myId, role: 'user' }).into('user_roles').then((data) => {
                                console.log("Response from DB when creating new record: ", data)
                            }).catch( (error) => { console.log(error) })

                        }).catch( (error) => { console.log(error) })
                        }

                        console.log("-----------------------------------")
                    })
                } else {

                    if(!newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email){ // Here when the customer do not provide Emaiil the object Email is not existen, so this will create it and load '$t' with undefined
                        newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email = { $t: undefined }
                    }
                    if(newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t == '@'){ // Here when the Email is ==- '@' change it to undefine
                        newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t = undefined
                    }


                    let propertyCode = jsOBJ.OTA_HotelStayInfoNotifRQ.StayInfos.HotelName
                    let sourceOfBussines = newRecords.HotelReservation.RoomStays.RoomStay.SourceOfBusiness
                    let dollarAmount = newRecords.RevenueCategories.RevenueCategory[0].SummaryAmount.Amount   // <-- Im asuming that the revenue category #9 is always on the index "0" of the array. // also later make it int
                    let startDate = newRecords.HotelReservation.RoomStays.RoomStay.TimeSpan.Start
                    let endDate = newRecords.HotelReservation.RoomStays.RoomStay.TimeSpan.End
                    let guestFirstName = newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.PersonName.GivenName
                    let guestLastName = newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.PersonName.Surname
                    let phoneNumber = (newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Telephone) ? newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Telephone.PhoneNumber : "No Phone"
                    let guestEmail = newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Email.$t
                    let postalCode = newRecords.HotelReservation.ResGuests.ResGuest.Profiles.ProfileInfo.Profile.Customer.Address.PostalCode
                    let hotelReservationID = newRecords.HotelReservation.UniqueID.ID
                    let processDate = jsOBJ.OTA_HotelStayInfoNotifRQ.TransactionIdentifier

                    console.log("\nThis file has: 1 Record.")
                    // console.log("\n----------------------------------")
                    // console.log(" Property Code: ", propertyCode)
                    // console.log(" SourceOfBusiness: ", sourceOfBussines)
                    // console.log(" DollarAmount: ", dollarAmount)
                    // console.log(" StartDate (Arival): ", startDate)
                    // console.log(" EndDate (Departure): ", endDate)
                    // console.log(" GuestFirstName: ", guestFirstName)
                    // console.log(" GuestLastName: ", guestLastName)
                    // console.log(" PhoneNumber: ", phoneNumber)
                    // console.log(" Email: ", guestEmail)
                    // console.log(" PostalCode: ", postalCode)
                    // console.log(" HotelReservationID: ", hotelReservationID)
                    // console.log(" ProcessDate: ", processDate)
                    // console.log("---------------------------------- ")

                    let tranInfo = {
                        id: '6a6473ae-c11e-4d5c-b942-979d524a04c3',
                        OwnerUserId: '',
                        PropertyCode: propertyCode,
                        SourceOfBusiness: sourceOfBussines,
                        DollarAmount: '99',
                        EndDate: endDate,
                        GuestFirstName: guestFirstName,
                        GuestLastName: guestLastName,
                        PhoneNumber: '',
                        Email: guestEmail,
                        PostalCode: '',
                        Points: '19',
                        HotelReservationId: hotelReservationID,
                        ProcessDate: processDate
                    }

                    console.log("----------------------------------")
                    console.log(tranInfo)
                    console.log("----------------------------------")



                    
                    // let companyId = '73f32ab9-4ecb-4361-b945-4f9740c4033d'
                    let companyId = 'cryst'

                    if(guestEmail === undefined){
                        console.log("No Email... No Points..............................")
                    }else{
                        console.log( '\n About to create record.')

                            // Inserting record to database:
                        db.insert(tranInfo).into('CrystalPointsTransactions').then((data) => {
                            console.log("Response from DB when creating new record: ", data)

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
                            
                        
                    }
                }



                
            })

               
        }else{
            console.log(`Check: ${myCount} - No File to Process`)
        }
    
      })

    myCount = myCount + 1
}


setInterval(() => { theFun1() }, 2000)



// ===[ Server ]============================
// app.listen((process.env.PORT || 3000), (err) => {
    app.listen((process.env.PORT || 5000), (err) => {
        if(err){ throw err }
    console.log("Server LOP: 5000 .....\n")
})

