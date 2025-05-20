package com.eleveo.carshophomework;

import com.eleveo.carshophomework.shopper.CarShopper;
import com.eleveo.carshophomework.shopper.DummyCarShopper;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

@SpringBootTest
@WireMockTest(httpPort = 8444)
class CarShopHomeworkApplicationTests {

	private static final String BASE_URL = "http://localhost:8444/";
	CarShopper carShopper = new DummyCarShopper();

	@Test
	void singleCarOrder() {
		stubFor(get("/cars").willReturn(ok()
				.withHeader("Content-Type", "application/json")
				.withBodyFile("single-car.json")
		));
		stubFor(post("/orders").willReturn(noContent()));
		carShopper.selectAndBuyCars(BASE_URL);
		verify(postRequestedFor(urlPathEqualTo("/orders"))
				.withRequestBody(equalToJson("{\"carId\": \"79c7faaf-d0af-304e-94aa-6e426ae1d07a\"}")));

	}

}
